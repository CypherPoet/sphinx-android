import Tor, { RequestMethod } from 'react-native-tor';
const tor = Tor();

type RequestOptions = {
  url: string;
  method: RequestMethod;
  data?: string;
  headers?: any;
  trustSSL: boolean;
}


const performTorRequest = async({
  url,
  method,
  data,
  headers,
  trustSSL = true,
}: RequestOptions) => {
  await tor.startIfNotStarted();

  switch (method.toLowerCase()) {
    case RequestMethod.GET:
      const getResult = await tor.get(url, headers, trustSSL);
      if (getResult.json) {
        return getResult.json;
      }
    case RequestMethod.POST:
      const postResult = await tor.post(
        url,
        data || '',
        headers,
        trustSSL
      );
      if (postResult.json) {
        return postResult.json;
      }
    case RequestMethod.DELETE:
      const deleteResult = await tor.delete(url, data, headers, trustSSL);
      if (deleteResult.json) {
        return deleteResult.json;
      }
      break;
  }
};

export { performTorRequest, RequestMethod };
