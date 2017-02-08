import webpack from "webpack"
import chalk from "chalk"

import { createNotification } from "./util"

import HotServerManager from "./HotServerManager"
import HotClientManager from "./HotClientManager"

import ConfigFactory from "../webpack/ConfigFactory"

function safeDisposer(server) {
  return server ? server.dispose() : Promise.resolve()
}

/* eslint-disable arrow-body-style */

const getCompilerFactory = (name) =>
{
  return function createCompiler(label)
  {
    try {
      console.log(`${label} Generating Webpack Config...`)
      const webpackConfig = ConfigFactory({
        target: name === "server" ? "node" : "web",
        mode: "development"
      })

      console.log(`${label} Initiating Webpack...`)
      return webpack(webpackConfig)
    }
    catch (error)
    {
      createNotification({
        title: "development",
        level: "error",
        message: "Webpack config is invalid, please check the console for more information.",
        notify: true
      })

      console.error(error)
      throw error
    }
  }
}

export default class HotController
{
  constructor()
  {
    this.hotClientManager = null
    this.hotServerManager = null

    const createClientCompiler = getCompilerFactory("client")
    const createServerCompiler = getCompilerFactory("server")

    const createClientManager = () =>
    {
      const label = chalk.blue("Hot Client Manager:")
      console.log(`${label} Preparing...`)

      return new Promise((resolve) =>
      {
        const compiler = createClientCompiler(label)

        compiler.plugin("done", (stats) =>
        {
          console.log(`${label} Done`)
          if (!stats.hasErrors()) {
            resolve(compiler)
          }
        })

        this.hotClientCompiler = compiler
        this.hotClientManager = new HotClientManager(compiler)
      }).catch((error) => {
        console.error(`${label} Error`, error)
      })
    }

    const createServerManager = () =>
    {
      const label = chalk.magenta("Hot Server Manager:")
      console.log(`${label} Preparing...`)

      return new Promise((resolve) =>
      {
        const compiler = createServerCompiler(label)

        compiler.plugin("done", (stats) =>
        {
          console.log(`${label} Done`)
          if (!stats.hasErrors()) {
            resolve(compiler)
          }
        })

        this.hotServerCompiler = compiler
        this.hotServerManager = new HotServerManager(compiler, this.hotClientCompiler)
      }).catch((error) => {
        console.error(`${label} Error:`, error)
      })
    }

    createClientManager().then(createServerManager).catch((error) => {
      console.error("Error during build:", error)
    })
  }

  dispose()
  {
    // First the hot client server. Then dispose the hot node server.
    return safeDisposer(this.hotClientManager).then(() => safeDisposer(this.hotServerManager)).catch((error) => {
      console.error(error)
    })
  }
}
