const ORBS = [
  { size: 520, top: "-10%", left: "-5%", anim: "orb-float-1", dur: "34s", delay: "0s" },
  { size: 420, top: "15%", left: "70%", anim: "orb-float-2", dur: "42s", delay: "-6s" },
  { size: 600, top: "55%", left: "10%", anim: "orb-float-3", dur: "48s", delay: "-12s" },
  { size: 360, top: "70%", left: "65%", anim: "orb-float-1", dur: "30s", delay: "-4s" },
  { size: 480, top: "35%", left: "40%", anim: "orb-float-2", dur: "44s", delay: "-10s" },
  { size: 300, top: "5%", left: "50%", anim: "orb-float-3", dur: "36s", delay: "-8s" },
];

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="bg-orb"
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            top: orb.top,
            left: orb.left,
            animation: `${orb.anim} ${orb.dur} ease-in-out ${orb.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}