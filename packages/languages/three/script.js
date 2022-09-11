noise(6, 0.1)
  .color(1, 0, 0)
  .add(noise(6, 0.1).color(0, 1, 1).scale(1.05))
  .modulate(noise(100).luma(0.6).color(1, 0, 0).pixelate(1, () => Math.max(1, a.fft[5] * 30)), 0.5)
  .out(o0)




























solid(0, 0, 0).out(o0)

src(o2)
  .color(1, 1, 1, 0.2)
  .modulate(color(0, () => a.fft[0], 0))
  .modulate(noise(100).luma(0.6).color(1, 0, 0).pixelate(1, () => Math.max(1, a.fft[5] * 30)), 0.5)
  .layer(src(s0)).out(o2)

makeLight("coral")

src(o1)
  .layer(src(o2))
  .out(o0)

src(o1).layer(src(s0)).out()

for (var i = 0; i < 12; ++i) {
  makeSphere("ball" + i, "bisque", 0.4, Math.random() * 5 - 2.5, 3, Math.random() * 5 - 2.5)
}

  lights("deeppink", "lightskyblue")


move(() => {
  speed = 2
  scene.rotation.y = time
  for (var i = 0; i < 12; ++i) {
    window["ball" + i].scale.y = a.fft[i]
    window["ball" + i].position.y = Math.sin(time / 10 + i) * 5
  }
  donut.rotation.x = time / 4
})

ground(null)







makeDonut("donut", 2, 0.8)



osc(20, -0.02, 0.2)
  // .brightness(0.4)
  .kaleid(20)
  .layer(src(o1)).out()

src(o1)
  .modulate(noise().color(0.5, 1, 0), 0.01)
  .modulate(solid(0, 0.01))
  .color(1, 1, 1, 0.99)
  .layer(
    src(s0)
      .scrollX(() => Math.sin(time) * 0.4)
      .scrollY(() => Math.cos(time/2) * 0.4)
   ).out(o0)

noise(4, a.fft[1]*4).color(0.04, 0.85, 0.65).invert()
  .sub(noise(4.01, a.fft[2]*4).color(0.63, 0.9, 0.04))
  .contrast(0.4)
  .brightness(0.3)
  .blend(solid(1, 0.74, 0.75), () => a.fft[2] + 0.9)
  .out(o1)

src(s0).scrollX(-0.2)
      // .modulate(osc(40, 0.3).color(0, 1, 0))
      .modulate(osc(2, 0.8).color(2, 0, 0))
      .brightness(0.2)
  .out(o2)

src(o3)
  .layer(src(o2))
  .color(2, 2, 2, 0.9)
  .modulate(noise(29, 0.8), 0.005)
  .scrollX(0.01)
  .out(o3)

src(o1).layer(src(o3)).layer(src(o2)).out()

a.hide()

a.setBins(4)

noise(4, a.fft[1]*4).color(0.04, 0.85, 0.65).invert()
  .sub(noise(4.01, a.fft[2]*4).color(0.63, 0.9, 0.04))
  .contrast(0.4)
  .brightness(0.3)
  .blend(solid(1, 0.74, 0.75), () => a.fft[2] + 0.9)
  .out(o1)

src(s0).scrollX(-0.2)
      // .modulate(osc(40, 0.3).color(0, 1, 0))
      .modulate(osc(2, 0.8).color(2, 0, 0))
      .brightness(0.2)
  .out(o2)

src(o3)
  .layer(src(o2))
  .color(2, 2, 2, 0.9)
  .modulate(noise(29, 0.8), 0.005)
  .scrollX(0.01)
  .out(o3)

src(o1).layer(src(o3)).layer(src(o2)).out()

a.hide()

a.setBins(4)

src(o0).color(1, 1, 1, 0.4).modulate(noise()).blur()
  .layer(src(s0).modulate(osc().color(0, 1, 0), 0.01)).out()

move(() => {
    if (a.fft[0] > 0.7) {
      for (var i = 0; i < 20; ++i) {
        makeSphere("ball" + i, "pink", 0.4, Math.random() * 8 - 4, Math.random() * 5, Math.random() * 8 - 4)
      }
    }
  scene.rotation.y = time * 0.1;
  l.intensity = Math.sin(time * 2) * 0.5 + 0.5
})

lights("coral", "dodgerblue")

makeLight("l", "pink", 1, 10, 1)