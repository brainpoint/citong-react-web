/**
 * Copyright (c) 2016-present, brainpoint Holding Limited.
 * All rights reserved.
 *
 * @providesModule ReactWebView
 *
 */
'use strict';

import React, { PropTypes, cloneElement } from 'react';
import View from 'ReactView';
import Text from 'ReactText';
import ActivityIndicator from 'ReactActivityIndicator';
import StyleSheet from 'ReactStyleSheet';
import Dimensions from 'ReactDimensions';
import fetch from 'ReactFetch';
import deepEqual from 'deep-equal';

const deviceSize = Dimensions.get('window');
const WEBVIEW_REF = 'webview';

var BGWASH = 'rgba(255,255,255,0.8)';

var WebViewState = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  ERROR: 'ERROR',
};

const NavigationType = {
  click: 'click',
  formsubmit: 'formsubmit',
  backforward: 'backforward',
  reload: 'reload',
  formresubmit: 'formresubmit',
  other: 'other',
};

const JSNavigationScheme = 'react-js-navigation';


// styles moved to the top of the file so getDefaultProps can refer to it
var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BGWASH,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 2,
  },
  errorTextTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
  },
  hidden: {
    height: 0,
    flex: 0, // disable 'flex:1' when hiding a View
  },
  loadingView: {
    backgroundColor: BGWASH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
  webView: {
    backgroundColor: '#ffffff',
  }
});


var defaultRenderLoading = () => {
  return (
    <View style={styles.loadingView}>
      <ActivityIndicator/>
    </View>
  ); 
};

var defaultRenderError = (errorDomain, errorCode, errorDesc) => {

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTextTitle}>Error loading page</Text>
      <Text style={styles.errorText}>{'Domain: ' + errorDomain}</Text>
      <Text style={styles.errorText}>{'Error Code: ' + errorCode}</Text>
      <Text style={styles.errorText}>{'Description: ' + errorDesc}</Text>
    </View>
  );
};

class WebView extends React.Component {

  propTypes = {
      /**
       * Loads static html or a uri (with optional headers) in the WebView.
       */
      source: PropTypes.oneOfType([
        PropTypes.shape({
          /*
          * The URI to load in the `WebView`. Can be a local or remote file.
          */
          uri: PropTypes.string,
          /*
          * The HTTP Method to use. Defaults to GET if not specified.
          * NOTE: On Android, only GET and POST are supported.
          */
          method: PropTypes.string,
          /*
          * Additional HTTP headers to send with the request.
          * NOTE: On Android, this can only be used with GET requests.
          */
          headers: PropTypes.object,
          /*
          * The HTTP body to send with the request. This must be a valid
          * UTF-8 string, and will be sent exactly as specified, with no
          * additional encoding (e.g. URL-escaping or base64) applied.
          * NOTE: On Android, this can only be used with POST requests.
          */
          body: PropTypes.string,
        }),
        PropTypes.shape({
          /*
          * A static HTML page to display in the WebView.
          */
          html: PropTypes.string,
          /*
          * The base URL to be used for any relative links in the HTML.
          */
          baseUrl: PropTypes.string,
        }),
        /*
        * Used internally by packager.
        */
        PropTypes.number,
      ]),

      /**
       * Function that returns a view to show if there's an error.
       */
      renderError: PropTypes.func, // view to show if there's an error
      /**
       * Function that returns a loading indicator.
       */
      renderLoading: PropTypes.func,
      /**
       * Function that is invoked when the `WebView` has finished loading.
       */
      onLoad: PropTypes.func,
      /**
       * Function that is invoked when the `WebView` load succeeds or fails.
       */
      onLoadEnd: PropTypes.func,
      /**
       * Function that is invoked when the `WebView` starts loading.
       */
      onLoadStart: PropTypes.func,
      /**
       * Function that is invoked when the `WebView` load fails.
       */
      onError: PropTypes.func,
      /**
       * Boolean value that determines whether the web view bounces
       * when it reaches the edge of the content. The default value is `true`.
       * @platform ios
       */
      bounces: PropTypes.bool,
      // /**
      //  * A floating-point number that determines how quickly the scroll view
      //  * decelerates after the user lifts their finger. You may also use the
      //  * string shortcuts `"normal"` and `"fast"` which match the underlying iOS
      //  * settings for `UIScrollViewDecelerationRateNormal` and
      //  * `UIScrollViewDecelerationRateFast` respectively:
      //  *
      //  *   - normal: 0.998
      //  *   - fast: 0.99 (the default for iOS web view)
      //  * @platform ios
      //  */
      // decelerationRate: ScrollView.propTypes.decelerationRate,
      /**
       * Boolean value that determines whether scrolling is enabled in the
       * `WebView`. The default value is `true`.
       * @platform ios
       */
      scrollEnabled: PropTypes.bool,
      /**
       * Controls whether to adjust the content inset for web views that are
       * placed behind a navigation bar, tab bar, or toolbar. The default value
       * is `true`.
       */
      automaticallyAdjustContentInsets: PropTypes.bool,
      /**
       * The amount by which the web view content is inset from the edges of
       * the scroll view. Defaults to {top: 0, left: 0, bottom: 0, right: 0}.
       */
      contentInset: PropTypes.object,
      /**
       * Function that is invoked when the `WebView` loading starts or ends.
       */
      onNavigationStateChange: PropTypes.func,
      /*/
       * Boolean value that forces the `WebView` to show the loading view
       * on the first load.
       */
      startInLoadingState: PropTypes.bool,
      /**
       * The style to apply to the `WebView`.
       */
      style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),

      /**
       * Boolean value to enable JavaScript in the `WebView`. Used on Android only
       * as JavaScript is enabled by default on iOS. The default value is `true`.
       * @platform android
       */
      javaScriptEnabled: PropTypes.bool,

      /**
       * Boolean value to control whether DOM Storage is enabled. Used only in
       * Android.
       * @platform android
       */
      domStorageEnabled: PropTypes.bool,

      /**
       * Set this to provide JavaScript that will be injected into the web page
       * when the view loads.
       */
      injectedJavaScript: PropTypes.string,

      /**
       * Sets the user-agent for the `WebView`.
       * @platform android
       */
      userAgent: PropTypes.string,

      /**
       * Boolean that controls whether the web content is scaled to fit
       * the view and enables the user to change the scale. The default value
       * is `true`.
       */
      scalesPageToFit: PropTypes.bool,

      /**
       * Function that allows custom handling of any web view requests. Return
       * `true` from the function to continue loading the request and `false`
       * to stop loading.
       * @platform ios
       */
      onShouldStartLoadWithRequest: PropTypes.func,

      /**
       * Boolean that determines whether HTML5 videos play inline or use the
       * native full-screen controller. The default value is `false`.
       *
       * **NOTE** : In order for video to play inline, not only does this
       * property need to be set to `true`, but the video element in the HTML
       * document must also include the `webkit-playsinline` attribute.
       * @platform ios
       */
      allowsInlineMediaPlayback: PropTypes.bool,

      /**
       * Boolean that determines whether HTML5 audio and video requires the user
       * to tap them before they start playing. The default value is `false`.
       */
      mediaPlaybackRequiresUserAction: PropTypes.bool
  }

  state = {
      viewState: WebViewState.IDLE,
      lastErrorEvent: null,
      startInLoadingState: true,
  }

  defaultProps = {
    javaScriptEnabled : true,
    scalesPageToFit: true,
  }

  getInnerViewNode() {
    return this.refs[WEBVIEW_REF].childNodes[0];
  }

  componentWillMount() {
    if (this.props.startInLoadingState) {
      this.setState({viewState: WebViewState.LOADING});
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.source !== nextProps.source) {
      var source = nextProps.source || {};
      if (nextProps.html) {
        source.html = nextProps.html;
      } else if (nextProps.url) {
        source.uri = nextProps.url;
      }

      if (!deepEqual(source, this._source))
        this._fetchSource(source);
    }
  }

  render() {
    var otherView = null;

    if (this.state.viewState === WebViewState.LOADING) {
      otherView = (this.props.renderLoading || defaultRenderLoading)();
    } else if (this.state.viewState === WebViewState.ERROR) {
      var errorEvent = this.state.lastErrorEvent;
      // invariant(
      //   errorEvent != null,
      //   'lastErrorEvent expected to be non-null'
      // );
      otherView = (this.props.renderError || defaultRenderError)(
        errorEvent.domain,
        errorEvent.code,
        errorEvent.description
      );
    } else if (this.state.viewState !== WebViewState.IDLE) {
      console.error(
        'RCTWebView invalid state encountered: ' + this.state.loading
      );
    }

    var webViewStyles = [styles.container, styles.webView, this.props.style];
    if (this.state.viewState === WebViewState.LOADING ||
      this.state.viewState === WebViewState.ERROR) {
      // if we're in either LOADING or ERROR states, don't show the webView
      webViewStyles.push(styles.hidden);
    }

    // var onShouldStartLoadWithRequest = this.props.onShouldStartLoadWithRequest && ((event/*: Event*/) => {
    //   var shouldStart = this.props.onShouldStartLoadWithRequest &&
    //     this.props.onShouldStartLoadWithRequest(event.nativeEvent);
    //   RCTWebViewManager.startLoadWithResult(!!shouldStart, event.nativeEvent.lockIdentifier);
    // });

    // var decelerationRate = processDecelerationRate(this.props.decelerationRate);
    var source = this.props.source || {};
    if (this.props.html) {
      source.html = this.props.html;
    } else if (this.props.url) {
      source.uri = this.props.url;
    }

    if (!deepEqual(source, this._source))
      this._fetchSource(source);

    var childrens;
    if (otherView) {
      childrens = otherView;
    } else {
      if (this._html) {
        childrens = (
          <View ref={WEBVIEW_REF}>
            style={webViewStyles}
            dangerouslySetInnerHTML={{__html: this._html}}
          </View>
        );
      }
    }

    return (
      <View style={styles.container}>
        {childrens}
      </View>
    );
  }

  goForward() {}
  goBack() {}
  reload() {}
  stopLoading() {}

  _updateNavigationState(event) {
    if (this.props.onNavigationStateChange) {
      this.props.onNavigationStateChange(null/*event.nativeEvent*/);
    }
  }

  getWebViewHandle() { return this.refs[WEBVIEW_REF]; }

  _onLoadingStart(event) {
    this.setState({
      viewState: WebViewState.LOADING
    });
    var onLoadStart = this.props.onLoadStart;
    onLoadStart && onLoadStart(event);
    this._updateNavigationState(event);
  }

  _onLoadingError(event) {
    //event.persist(); // persist this event because we need to store it
    var {onError, onLoadEnd} = this.props;
    onError && onError(event);
    onLoadEnd && onLoadEnd(event);
    //console.warn('Encountered an error loading page', event.nativeEvent);

    // if (this.state.viewState !== WebViewState.ERROR
    // && this.state.lastErrorEvent !== event)
    // {
      this.setState({
        lastErrorEvent: event,//event.nativeEvent,
        viewState: WebViewState.ERROR
      });
    // }
  }

  _onLoadingFinish() {
    var {onLoad, onLoadEnd} = this.props;
    onLoad && onLoad(event);
    onLoadEnd && onLoadEnd(event);
    this.setState({
      viewState: WebViewState.IDLE,
    });
    this._updateNavigationState(event);
  }

  _fetchSource(source) {
    this._source = source;
    if (source.html) {
      this._html = source.html;
      this._onLoadingFinish();
    } else if (source.uri){
      this._onLoadingStart();
      
      fetch(source.uri, {
        mode: "cors",
        method:  (source.method?source.method:'GET'),
        headers: source.headers,
        body: source.body
      })
      .then(res=>res.text())
      .then(data=>{
        this._html = data;
        this._onLoadingFinish();
      })
      .catch(err=>{
        // err.domain = source.uri;
        this._onLoadingError({domain:source.uri, description:err});
      });
    }
  }
};

WebView.JSNavigationScheme = JSNavigationScheme;
WebView.NavigationType = NavigationType;
WebView.isReactNativeComponent = true;


export default WebView;