osc(25, 0)
  .thresh(0.8)
  .rotate(Math.PI / 2)
  .scrollY(() => time * -0.2)
  .modulate(osc(77, 0.02).mult(osc(63, 0.01, 0.8)).mult(osc(51, -0.03)), -0.2)
  .color(1, 0, 0.4)
  .out();
