const { CanvasRenderService } = require('chartjs-node-canvas')


module.exports = async (text, data, labels) => {
  const canvasRenderService = new CanvasRenderService(1200, 600)

  const configuration = {
    backgroundColor: 'rgba(48, 160, 214, 1)',
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: 'rgba(48, 160, 214, 0.2)',
        borderColor: 'rgba(48, 160, 214, 1)',
      }],
    },
    options: {
      title: {
        display: true,
        fontSize: 25,
        fontColor: 'rgba(48, 160, 214, 1)',
        text,
      },
      legend: {
        display: false,
      },
    },
  }

  const image = await canvasRenderService.renderToBuffer(configuration)

  return image
}
