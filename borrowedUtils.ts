const convertIncomingMessageToRequest = (req: ExpressRequest): Request => {
    var headers = new Headers();
    for (var key in req.headers) {
      if (req.headers[key]) headers.append(key, req.headers[key] as string);
    }
    let request = new Request(req.url, {
      method: req.method,
      body: req.method === 'POST' ? req.body : null,
      headers,
    })
    return request
  }