import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
// IE11 support for @wouter
import 'new-event-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import qs from 'qs';
import App from './components/App';

import './i18n';
import './index.less';

axios.defaults.paramsSerializer = (params: any) => {
  return qs.stringify(params);
};

// set up axios default here, resolving ie11 undesirable cache
axios.defaults.headers = {
  Pragma: 'no-cache'
};

ReactDOM.render(<App />, document.getElementById('root'));
