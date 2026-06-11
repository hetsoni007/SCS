function handler(event) {
  var request = event.request;

  // 301 redirects for legacy pages Google indexed on the old site (now removed)
  var key = request.uri.toLowerCase().replace(/\/+$/, '') || '/';
  var GONE = { '/usa': 1, '/uk': 1, '/uae': 1, '/australia': 1, '/canada': 1 };
  if (GONE[key]) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { 'location': { value: 'https://soniconsultancyservices.com/' } }
    };
  }

  // clean-URL rewrite -> serve folder index.html
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    request.uri = uri + '/index.html';
  }
  return request;
}
