const randomInt = (min, max) => {
  return Math.round(Math.random() * ((max + 1) - min) + min)
}

exports.randomPort = () => {
  // Those forbidden ports are in line with shiny
  // https://github.com/rstudio/shiny/blob/288039162086e183a89523ac0aacab824ef7f016/R/server.R#L734
  const forbiddenPorts = [3659, 4045, 6000, 6665, 6666, 6667, 6668, 6669, 6697];
  while (true) {
    let port = randomInt(3000, 8000)
    if (forbiddenPorts.includes(port))
      continue
    return port
  }
}

exports.waitFor = (milliseconds) => {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, milliseconds);
  })
}

