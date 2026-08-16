# Google AdSense Integration

Stock Harvesting uses manual AdSense placements only. Auto Ads, popups, interstitials, vignette ads, login/register ads, and share-to-unlock flows are intentionally not wired.

## Environment

Frontend variables:

```env
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_LANDING_PRIMARY_SLOT=0000000000
NEXT_PUBLIC_ADSENSE_LANDING_SECONDARY_SLOT=0000000000
NEXT_PUBLIC_ADSENSE_SCANNER_SLOT=0000000000
```

If the client or a slot is missing, production collapses the ad placement cleanly. Development shows a neutral placeholder so layout can be reviewed.

## Placements

Landing page:

- Primary placement after the chart workspace section.
- Secondary placement after market coverage.

Scanner:

- One bottom placement after chart controls.
- It is never rendered over the chart canvas, toolbar, floating tools, or drawing controls.

Auth pages do not load the AdSense script.

## ads.txt

`public/ads.txt` is intentionally a setup placeholder. After AdSense approval, copy the exact line from Google AdSense into that file. Do not invent the publisher ID.

Expected format:

```txt
google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
```

## Consent And CMP

Before broad traffic or EU/UK/EEA serving, configure a Google-certified CMP or Google Privacy & Messaging. This implementation is ready for AdSense tags but does not implement consent collection by itself.

## CSP

No project-level CSP header was found during implementation. If a CSP is added later, allow the minimum Google AdSense script/frame/image/connect origins required by Google instead of opening broad wildcards.

## Performance

The script is loaded once through `next/script` with `lazyOnload`. The hero and core scanner render path do not wait for AdSense. Ad containers reserve a small minimum height only when configured or when the development placeholder is shown.