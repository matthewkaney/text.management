// trippy drippy
osc(25, 0)
  .thresh(k4(0.5, 0.99))
  .rotate(Math.PI / 2)
  // .modulate(osc(77, 0.02).mult(osc(63, 0.01, 0.8)).mult(osc(51, -0.03)), 0.4)
  // .scrollX(v("thyme", t(0.4)))
  .kaleid(ease(v("koyd", 20)))
  .rotate(t(0.2))
  .kaleid(4)
  .contrast(4)
  .repeat(4, 4)
  // .invert(cyc(t(4.2), 0, 1))
  .out(o1);
src(o1)
  .rotate(v("rawt", t(-2)))
  .color(0.4, 1, 0.4)
  .hue(t(-0.3))
  .modulateHue(osc(20, 2, 10))
  // .layer(src(o1).rotate(v("rawt", t(4))).color(0, 0.3, 0.2).hue(t(0.2)).mask(src(o2)))
  // .kaleid(k5(3, 8))
  .rotate(t(-0.0002))
  .blend(src(o0).scale(2), 0.7)
  .out(o0);
osc(50, 0.1).thresh(0.2).out(o2);

// trippy drippy
osc(25, 0, 20)
  // .thresh(k2(0.5, 0.99))
  .scrollY(v("sy", t(-9)))
  // .modulate(osc(77, 0.02).mult(osc(63, 0.01, 0.8)).mult(osc(51, -0.03)), k4(-2, 2))
  // .modulate(osc(3, 0, 0), ease(cyc(acc(q()), -0.2, 0.2)))
  .hue(v("col", t(8)))
  .contrast(4)
  // .kaleid(k4(2, 8))
  .blend(src(o2), k8())
  .rotate(v("rawdog", t(8)))
  .out(o1);
src(o1)
  .mult(src(o1).scale(1, -1), 0.9)
  .rotate(ease(acc(cyc(t(4), 0, 0.1))))
  .colorama(0.2)
  // .pixelate(30)
  .out(o0);

osc(20, 0.8, 10)
  .colorama(0.2)
  .rotate(ease(acc(q(PI / 4))))
  .out(o1);
src(o1)
  // .add(src(o1).scale(1.5))
  .modulate(voronoi(10, 4, 0), k2())
  .contrast(2)
  .mult(src(o1).modulate(noise(2, 0.1), k4()))
  .scale(1, 1, 1.5)
  .out(o2);

// mandala effect
noise(20, k6(), 30)
  .rotate(ease(acc(q(0.5))))
  .color(0.9, 0.2, 0.1)
  .hue(k3())
  .brightness(k2(0.2, 0.5))
  .contrast(4)
  .posterize(4)
  .kaleid(20)
  .repeatX(k6(1, 4))
  .scale(k5(0.5, 4), 1, 1.5)
  .rotate(v("rotot", ease(acc(clk(8, PI)))))
  .scale(t(0.1))
  .blend(src(o0).rotate(t(0.4)), k8(0.99))
  .blend(src(o0).rotate(0.002), k6())
  .out(o0);

noise(k1(2, 3), 0.02)
  .posterize(6)
  .colorama(3.3)
  .saturate(0.8)
  .brightness(-0.2)
  .hue(t(k2(2)))
  .color(1, k7(), 0)
  .modulate(osc(2, 2), ease(acc(note())))
  .rotate(ease(acc(q(PI / 4))))
  // .pixelate(100, 50)
  // .modulate(o0, 0.04)
  .add(o0, 0.4)
  .out(o0);

// mandala effect
noise(8, 20)
  .rotate(ease(acc(q(0.5))))
  .kaleid(80)
  .thresh(0.2)
  .color(0.9, 0.2, 0.1)
  .hue(v("hugh", t(0.5)))
  .modulate(src(o2).hue(0.5), 0.6)
  .rotate(t(2))
  .scale(1, 1, v("sale", t(0.2)))
  .out(o1);
src(o1)
  .pixelate(40, 40)
  .colorama(0.2)
  .mult(
    osc(80, 0, 0)
      .thresh(0.5)
      .rotate(v("roe", t(-4)))
  )
  .out(o0);

noise(k1(2, 10), 4)
  .colorama(4)
  // .kaleid(8)
  // .modulate(noise(10, 4), 0.01)
  // .add(src(o1))
  .layer(src(o2).mask(src(o2)))
  .repeat(4, 3)
  .scale(t(0.5), 1, 1, 1, t(2))
  // .modulate(noise(2), v("voyse", t(-0.04)))
  // .rotate(t(0.3))
  .modulate(osc(7, 2), 0.1)
  .out(o0);

shape(4, k3(0.3, 0.6))
  .invert(1)
  .rotate(ease(acc(note(PI))))
  .scale(1, 1, 1.5)
  .pixelate(width / 10, height / 10)
  .mult(src(o2), 0.8)
  .out(o2);

noise(k1(2, 10), 0.2)
  .colorama(k2(2))
  .rotate(k3(PI))
  .repeatY(k4(3))
  .modulate(noise(10, 4), 0.01)
  .rotate(v("t", ease(acc(clk(16, 2 * PI)))))
  // .add(src(o2), k8())
  .modulate(src(o2).scale(1, 1, -1), k7())
  .colorama(k5(0.2))
  .add(src(o0), k8())
  .scrollY(t(0.2))
  .out(o0);

// bad scan
osc(k5(2, 30), 0, 0.3)
  // .pixelate(width / 80, 1)
  .hue(t(0.002))
  // .scrollX(ease(acc(note(-8, 8))))
  .saturate(k1(6))
  // .modulate(osc(10, 4, 0).rotate(PI / 2), ease(v("m1", k6())))
  // .pixelate(width, height / 20)
  .modulate(noise(20, 10).add(osc(63, 0.01, 0.8)), k5(-0.1, 0.1))
  .blend(src(o0).rotate(k7(-0.2, 0.2)).scale(0.99), k8(0.99))
  .rotate(v("root", ease(acc(q(k2(-0.4))))))
  .out(o1);

src(o0).add(src(o1), 0.000001).out(o0);

// bad scan
osc(k5(2, 30), 0, 0.3)
  // .pixelate(width / 80, 1)
  .hue(k2())
  // .scrollX(ease(acc(note(-8, 8))))
  .saturate(k1(6))
  // .modulate(osc(10, 4, 0).rotate(PI / 2), ease(v("m1", k6())))
  // .pixelate(width, height / 20)
  .modulate(noise(8, 10).add(osc(63, 0.01, 0.8)), 0.4)
  // .blend(src(o0).rotate(k7(-0.2, 0.2)).scale(0.99), 0.2)
  // .rotate(v('root', ease(acc(q(PI/4)))))
  .scrollX(v("srw", t(k6(-2, 2))))
  .posterize(k4(2, 8))
  // .colorama(0.2)
  .out(o2);
