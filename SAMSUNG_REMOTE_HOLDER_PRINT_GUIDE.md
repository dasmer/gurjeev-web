# Samsung QLED solar remote case — print guide

`samsung_qled_solar_remote_openback_sleeve.stl` is a chunky, rounded, open-face protective case—not a stand. Its broad back is a single continuous rounded block; the remote's control face stays accessible. The only opening in the back is a large rounded 32 × 114 mm solar-panel window, so the charging surface is not covered.

The outer shell is 70 × 165 mm with 10 mm plan-view corner rounds, 3 mm curved fillets around every outside perimeter edge, and a 10 mm-thick back. This deliberately oversized solid block helps the remote bridge gaps that a bare remote could fall through. Its slide-in bay is 46 mm wide × 140 mm long × 10 mm deep, intended for a slim Samsung solar remote up to approximately 44 mm wide, 138 mm long, and 10 mm thick. The remote inserts from the open top and rests against the lower stop.

## Flashforge Adventurer 5M / PLA settings

- Place the model flat with its back on the print bed; it needs no supports or brim.
- Use PLA, 0.20 mm layer height, 3–4 perimeters, and 15–20% gyroid or grid infill.
- A 0.4 mm nozzle is appropriate. Use the PLA temperature and cooling profile recommended by your filament maker.
- The thick anti-drop backing makes this sturdier than a sleeve. Expect a medium-length print.

Before the full job, measure the remote. If its width exceeds 44 mm, increase the `23` values that define the inner side-rail edges by half the required extra width, then regenerate with `ruby make_samsung_remote_holder.rb`.
