// FIXME: waiting for release of fixed package.json entry. >= 4.1.0
import "sanitize.css/sanitize.css"

import React from "react"
import { Switch, Route, NavLink } from "react-router-dom"
import Helmet from "react-helmet"
import { injectIntl, FormattedMessage, IntlProvider } from "react-intl"
import { connect } from "react-redux"

import { getLocale, getLanguage } from "../common/State"
import AsyncRoute from "../common/AsyncRoute"

// Application specific
import "./Fonts.css"
import Styles from "./Root.css"
import RouterConnector from "../common/RouterConnector"

import messages from "./messages/en.json"

function Error404() {
  return <div>Sorry, that page was not found.</div>
}

function Header({ intl }) {
  return (
    <header id="site-header">
      <Helmet
        titleTemplate={`${intl.formatMessage({ id: "app.title" })} - %s`}
        defaultTitle={intl.formatMessage({ id: "app.title" })}
        meta={[
          { name: "charset", content: "utf-8" },
          { "http-equiv": "X-UA-Compatible", "content": "IE=edge" },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          { name: "description", content: intl.formatMessage({ id: "app.description" }) }
        ]}
      />

      <h1 className={Styles.title}><FormattedMessage id="app.title"/></h1>
      <strong><FormattedMessage id="app.description"/></strong>
    </header>
  )
}

Header = injectIntl(Header)


function HomeComponent() {
  return <b>Home</b>
}




var LazyLoading = false
var LazyComponent = null
var LazyMessages = null

class AboutComponent extends React.Component {
  constructor(props, context) {
    super(props)

    this.state = {
      loading: LazyLoading,
      component: LazyComponent,
      messages: LazyMessages
    }
  }

  load(language) {
    return Promise.all([
      import("./views/About"),
      import("./views/messages/About." + language + ".json")
    ])
  }

  fetchData() {
    if (LazyLoading === true || LazyComponent != null) {
      return Promise.resolve()
    }

    console.log("AboutComponent: Loading...")
    this.setState({
      loading: true
    })

    LazyLoading = true

    return this.load("de").then((result) => {
      console.log("AboutComponent: Loading done!")
      console.log("AboutComponent: Result:", result)

      LazyComponent = result[0].default
      LazyMessages = result[1]
      LazyLoading = false

      this.setState({
        loading: LazyLoading,
        component: LazyComponent,
        messages: LazyMessages
      })

      console.log("AboutComponent: Final State...", this.state)
    })
  }

  componentDidMount() {
    console.log("AboutComponent: Mounting...", this.state)
    if (!LazyComponent) {
      this.fetchData()
    }
  }

  render() {
    let Component = LazyComponent
    let { load, ...props } = this.props

    return Component ? <Component {...props} /> : null
  }
}



function Root({ children, locale, language, intl }) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      <main>
        <Header/>

        <div>
          <ul>
            <li><NavLink exact to="/" activeClassName={Styles.activeLink}>Home</NavLink></li>
            <li><NavLink to="/about" activeClassName={Styles.activeLink}>About</NavLink></li>
            <li><NavLink to="/missing" activeClassName={Styles.activeLink}>Missing</NavLink></li>
          </ul>
        </div>

        <div>
          <RouterConnector>
            <Switch>
              <Route exact path="/" component={HomeComponent} />
              <Route path="/about" component={AboutComponent} />
              <Route component={Error404}/>
            </Switch>
          </RouterConnector>
        </div>
      </main>
    </IntlProvider>
  )
}

Root.propTypes = {
  children: React.PropTypes.node,
  locale: React.PropTypes.string,
  language: React.PropTypes.string,
  intl: React.PropTypes.object
}

const mapStateToProps = (state, ownProps) => ({
  locale: getLocale(state),
  language: getLanguage(state)
})

export default connect(mapStateToProps)(Root)
