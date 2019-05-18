const FormData = require('form-data')


module.exports = async (file) => {
  const form = new FormData()

  form.append('data', file, {
    filename: 'file',
  })
  return new Promise((resolve, reject) => {
    form.submit('https://telegra.ph/upload', (err, res) => {
      if (err) return reject(err)
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => resolve(JSON.parse(data)))
      res.on('error', reject)
    })
  })
}
