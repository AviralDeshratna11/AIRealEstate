"use client";

import type { DetailedHTMLProps, HTMLAttributes } from "react";
import Script from "next/script";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required to augment JSX.IntrinsicElements
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        "agent-id"?: string;
      };
    }
  }
}

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

// Embeds ElevenLabs' Conversational AI widget so site visitors can talk to the
// voice agent live. No-ops when NEXT_PUBLIC_ELEVENLABS_AGENT_ID is unset, matching
// this app's pattern of degrading gracefully instead of erroring on missing config.
export function VoiceAgentWidget() {
  if (!AGENT_ID) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[1200]">
      <elevenlabs-convai agent-id={AGENT_ID} />
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" async />
    </div>
  );
}
