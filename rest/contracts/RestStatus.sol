/*
 * @see: https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
 */
contract RestStatus {
  uint constant OK = 200;
  uint constant CREATED = 201;
  uint constant ACCEPTED = 202;
  uint constant ERROR = 400;
  uint constant BAD_REQUEST = 400;
  uint constant UNAUTHORIZED = 401;
  uint constant FORBIDDEN = 403;
  uint constant NOT_FOUND = 404;
}
