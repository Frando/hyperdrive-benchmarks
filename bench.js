const bench = require('nanobench')
const { HyperdriveClient } = require('hyperdrive-daemon-client')
const fs = require('fs')
const hyperdrive = require('hyperdrive')
const tmp = require('temporary-directory')
const p = require('path')

async function run () {
  // let handlers = [LocalFs, Hyperdrive, Client, Fuse]
  // TODO: Re-enable the fuse handler. It breaked a lot for me.
  let handlers = [LocalFs, Hyperdrive, Client]
  handlers = handlers.map(H => new H())

  for (let handler of handlers) {
    await handler.prepare()
  }

  await runBench({ handlers, count: 1000, size: 1024 * 4 })
  await runBench({ handlers, count: 1000, size: 1024 * 4, batch: 100 })
  await runBench({ handlers, count: 1000, size: 1024 * 4, batch: 1000 })
  await runBench({ handlers, count: 200, size: 1024 * 1024 * 2 })

  for (let handler of handlers) {
    await handler.cleanup()
  }
}

async function runBench (opts) {
  const { handlers, count, size, batch = 1 } = opts
  const buf = Buffer.alloc(size).fill(0)

  console.log('\n---\n')

  for (let handler of handlers) {
    let msg = `${handler.name}: ${count} * ${pretty(size)} (batch: ${batch})`
    await new Promise(resolve => {
      bench(msg, async b => {
        b.start()

        for (let i = 0; i < count; i += batch) {
          let proms = []
          for (let j = i; j < i + batch; j++) {
            let name = 'file' + j
            proms.push(handler.write(name, buf))
          }
          // console.log(`${handler.name} ${i} - ${i + batch}`, proms.length)
          await Promise.all(proms)
        }

        b.end()
        resolve()
      })
    })
  }
}

class LocalFs {
  async prepare () {
    this.name = 'local fs'
    const { dir, cleanup } = await tempDir()
    this.dir = dir
    this._cleanup = cleanup
  }

  async cleanup () {
    await this._cleanup()
  }

  write (name, buf) {
    return new Promise((resolve, reject) => {
      fs.writeFile(p.join(this.dir, name), buf, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }
}

class Hyperdrive {
  async prepare () {
    this.name = 'hyperdrive'
    const { dir, cleanup } = await tempDir()
    this._cleanup = cleanup
    this.drive = hyperdrive(dir)
    await new Promise(resolve => this.drive.ready(resolve))
  }

  async cleanup () {
    await this._cleanup()
  }

  write (name, buf) {
    return new Promise((resolve, reject) => {
      this.drive.writeFile(name, buf, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }
}

class Client {
  async prepare () {
    this.name = 'client'
    const client = new HyperdriveClient()
    await client.ready()

    const keyFile = p.join(__dirname, '.client-drive-key')
    try { var key = fs.readFileSync(keyFile) } catch (e) {}

    // TODO: Don't create a new drive all the time.
    const { opts, id } = await client.drive.get({ key })

    if (!key) fs.writeFileSync(keyFile, opts.key)

    this.id = id
    this.client = client
  }

  async write (name, buf) {
    await this.client.drive.writeFile(this.id, name, buf)
  }

  async cleanup () {
    // TODO: Deleting drives is not supported.
  }
}

class Fuse extends LocalFs {
  // TODO: Make own hyperdrive and mount it.
  async prepare () {
    this.name = 'fuse'
    const client = new HyperdriveClient()
    await client.ready()
    this.dir = p.join('/hyperdrive', 'home', '_bench')
    if (fs.existsSync(this.dir)) return
    await client.fuse.mount(this.dir)
  }
  async cleanup () {}
}

function pretty (bytes) {
  let prefixes = ['', 'K', 'M', 'G', 'T']
  let base = 1024
  for (let pow = prefixes.length - 1; pow >= 0; pow--) {
    if (bytes > Math.pow(base, pow)) {
      return Math.round(bytes / Math.pow(base, pow), 2) + prefixes[pow]
    }
  }
  return bytes
}

function tempDir () {
  return new Promise((resolve, reject) => {
    tmp((err, dir, _cleanup) => {
      if (err) reject(err)
      resolve({ dir, cleanup })
      function cleanup () {
        return new Promise((resolve, reject) => {
          _cleanup(err => err ? reject(err) : resolve())
        })
      }
    })
  })
}

run()
