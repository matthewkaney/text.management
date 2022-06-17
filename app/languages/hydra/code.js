// trippy drippy
osc(25, 0)
  .thresh(0.8)
  .rotate(Math.PI / 2)
  .scrollY(v("sy", t(-0.2)))
  .modulate(osc(77, 0.02).mult(osc(63, 0.01, 0.8)).mult(osc(51, -0.03)), -0.2)
  .color(1, 0, 0.4)
  .out();

// mandala effect
noise(20, k6(), 30)
  .rotate(v("r", ease(acc(q(0.1)))))
  .color(0.9, 0.2, 0.1)
  .hue(k3())
  .brightness(0.4)
  .contrast(4)
  .posterize(4)
  .kaleid(8)
  .rotate(v("r2"))
  .scale(k5(0.5, 4), 1, 1.5)
  .blend(src(o0), k8(0.99))
  .out(o0);

// bad scan
osc(20, 0, 0.3)
  .pixelate(width / 20, 1)
  .hue(cyc(t(1), 0, 0.4))
  .saturate(k1(6))
  .modulate(osc(10, 2, 0).rotate(PI / 2), ease(cyc(t(2), 0.06, 0, -0.06, 0)))
  .pixelate(width, height / 40)
  .blend(src(o0).rotate(0.02).scale(0.99), k8(0.99))
  .out(o0);
