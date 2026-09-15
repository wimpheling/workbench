# Roller stack: availability and CAD check, 13 September 2026

This is a dated website check, not an order, reserved stock or a mechanical
release. Quantities below cover both bifold doors. No account was created,
supplier contacted or purchase made.

**Update:** the user supplied the downloaded roller and bush STEP files later
on 13 September. Both are now imported into v3 without modification, with
native datums and tests documented in `v3/backend/enclosure/assets/GN753.md`.
The table below retains the earlier availability check with updated CAD status; only the spacer
file remains missing. Availability/prices are the dated observations below,
not a renewed stock check or reservation.

| Component | Qty | Exact supplier listing | Observed price and availability | CAD status |
| --- | ---: | --- | --- | --- |
| GN 753.1-22-B5-ZL-1 roller | 2 | [Reiman](https://reiman.pt/en/gn-753-1-22-b5-zl-1-guide-rollers-cylindrical/) | €6.23 excluding / €7.66 including tax each. Quantity band 1–2351: dispatch in 3–4 days; above that on request. | User-supplied vendor STEP imported unchanged into v3. |
| GN 753.2-4-5-3-AE-NI centring bush | 4 | [Reiman](https://reiman.pt/en/gn-753-2-4-5-3-ae-ni-mounting-accessories-bushing-one-sided-centering/) | €1.56 excluding / €1.92 including tax each. Quantity band 1–552: dispatch in 3–4 days; above that on request. | User-supplied vendor STEP imported unchanged into v3. |
| Essentra/Richco 311431040050, 10 mm spacer | 2 | [Elpro, DB MV 4,3/10 mm](https://www.elpro.org/gb/essentra-components-de17-3007-series/17295-db-mv-43-10-mm.html) | €0.306 excluding VAT each; displayed stock 2326. Small quantities 1–26 permitted. **Business customers only.** | Exact part identified in the [Essentra TraceParts catalogue](https://www.traceparts.com/en/product/essentra-components-spring-action-quarterturn-latches?Product=90-07082024-058976), despite its misleading family-page title. Description and part number match the spacer. No STEP obtained. |

Reiman's rendered quantity/dispatch tables were read in a browser, not inferred
from generic `InStock` structured data. The roller and bushes total €18.70
excluding tax / €23.00 at the displayed tax-inclusive unit prices, before
shipping. Dispatch is not a promise of arrival on a particular date.

[Elpro delivery terms](https://www.elpro.org/gb/content/3-payment-and-delivery)
list Portugal shipping at €29.95 excluding VAT for merchandise up to €25.
Its B2B-only restriction makes this a conditional sourcing route, not a confirmed
purchase option for a private customer. No delivered-order quote was obtained.

## Geometry and remaining procurement gaps

The [Ganter bush drawing](https://www.elesa-ganter.com/siteassets/PDF/EN/GN%20753.2.pdf)
specifies an 8 mm body diameter and a centring collar for the 5 mm roller bore.
The original app used a simplified 5 mm annulus. The supplied STEP now
replaces that envelope with the 8 mm body and 2 mm centring collar; the two
collars leave 1 mm between their tips in the 5 mm-wide bearing bore. Nominal
contact checks pass, but clamp loads and tolerances still require validation.

The [Essentra spacer catalogue](https://essentracomponents.bynder.com/m/349a8daccce450c7/original/2569513-pdf.pdf)
also identifies 311430440050 as a 4.3 mm bore / 8 mm OD / 4 mm long spacer.
That is a candidate for the extra spacing ring, not yet a stock-validated or
imported replacement. Final axle screw, lower washer/nut, metal stops and
load/creep/wear evidence remain outstanding.

## Download boundary

Reiman explicitly requires sign-in for STEP downloads. Ganter/JW Winco offer
account or email-mediated CAD access. Essentra's direct product page returned
Access Denied in this environment. Selecting STEP AP214 and activating the
download on the exact Essentra TraceParts record opened its sign-in form.
Public catalogue presence does not mean
the actual STEP file has been downloaded. Do not fabricate a STEP from our
parametric envelope and label it vendor geometry.

Remaining input needed: the genuine STEP for the exact 10 mm spacer. Roller
and bush source bytes, provenance, dimensions and native solids have now been
checked and integrated. No fabricated spacer STEP has been substituted.
