from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.models import NegotiationRequest, NegotiationResponse

try:
    from scipy.optimize import linprog
except Exception:  # pragma: no cover - scipy may be unavailable in constrained hosts
    linprog = None


@dataclass
class OptimizedOffer:
    price: float
    utility: float
    risk: str


class NegotiationOptimizer:
    """ASTRA bargaining optimizer.

    It treats price as the main decision variable and concession credits as secondary terms.
    The hidden walk-away price is enforced as a hard constraint but is never returned.
    """

    def optimize(self, request: NegotiationRequest) -> NegotiationResponse:
        offer = self._solve_lp(request)
        gap = abs(offer.price - request.opponent_offer) / max(request.opponent_offer, 1)
        confidence = "high" if gap < 0.04 else "medium" if gap < 0.10 else "low"

        terms = [
            "Keep inspection contingency active until document review is complete.",
            "Ask for written confirmation of fixtures, parking, and maintenance dues.",
        ]
        if request.concession_value > 0:
            terms.append("Use concession value as a non-price sweetener instead of crossing reservation price.")
        if request.urgency > 0.7:
            terms.append("Use a shorter response deadline to reduce competitive uncertainty.")

        return NegotiationResponse(
            counter_offer=round(offer.price, 2),
            confidence=confidence,
            rationale=(
                "Optimized counter-offer respects the hidden walk-away constraint while balancing "
                "target utility, observed opponent offer, urgency, and available concessions."
            ),
            suggested_terms=terms,
            risk_flags=[] if confidence != "low" else ["Large gap from opponent offer; prepare a second path."],
        )

    def _solve_lp(self, r: NegotiationRequest) -> OptimizedOffer:
        if linprog is None:
            return self._fallback(r)

        # Variables: [price, concession_credit].
        concession_max = max(r.concession_value, 1.0)
        if r.role.value == "buyer":
            lower = min(r.target_price, r.walk_away_price)
            upper = min(max(r.opponent_offer, r.target_price), r.walk_away_price)
            # Minimize price, but urgency pulls toward opponent to increase acceptance.
            c = np.array([1.0 - 0.35 * r.urgency - 0.1 * r.opponent_concession_trend, -0.08])
        else:
            lower = max(min(r.opponent_offer, r.target_price), r.walk_away_price)
            upper = max(r.target_price, r.opponent_offer, r.walk_away_price)
            # Maximize price by minimizing negative price.
            c = np.array([-1.0 + 0.25 * r.urgency + 0.1 * r.opponent_concession_trend, -0.08])

        bounds = [(lower, upper), (0, concession_max)]
        result = linprog(c=c, bounds=bounds, method="highs")
        if not result.success:
            return self._fallback(r)
        price = float(result.x[0])
        utility = float(-result.fun if r.role.value == "seller" else result.fun)
        return OptimizedOffer(price=price, utility=utility, risk="ok")

    @staticmethod
    def _fallback(r: NegotiationRequest) -> OptimizedOffer:
        if r.role.value == "buyer":
            anchor = r.target_price + (r.opponent_offer - r.target_price) * (0.25 + 0.35 * r.urgency)
            price = min(anchor, r.walk_away_price)
        else:
            anchor = r.target_price - (r.target_price - r.opponent_offer) * (0.25 + 0.25 * r.urgency)
            price = max(anchor, r.walk_away_price)
        return OptimizedOffer(price=price, utility=0, risk="fallback")
