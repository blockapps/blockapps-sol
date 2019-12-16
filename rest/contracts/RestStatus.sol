/*
 * @see: https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
 * @see: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 */
contract RestStatus {
  uint constant INFORMATIONAL = 100; // 1xx
  uint constant CONTINUE = 100;
  uint constant SWITCHING_PROTOCOLS = 101;
  
  uint constant SUCCESS = 200; // 2xx
  uint constant OK = 200;
  uint constant CREATED = 201;
  uint constant ACCEPTED = 202;
  uint constant NON_AUTHORITATIVE_INFORMATION = 203;
  uint constant NO_CONTENT = 204;
  uint constant PARTIAL_CONTENT = 206;
  uint constant MULTI_STATUS = 207;
  uint constant ALREADY_REPORTED = 208;
  uint constant IM_USED = 226;
  
  uint constant REDIRECTION = 300; // 3xx
  uint constant MULTIPLE_CHOICES = 300;
  uint constant MOVED_PERMANENTLY = 301;
  uint constant FOUND = 302;
  uint constant SEE_OTHER = 303;
  uint constant NOT_MODIFIED = 304;
  uint constant USE_PROXY = 305;
  uint constant SWITCH_PROXY = 306;
  uint constant TEMPORARY_REDIRECT = 307;
  uint constant PERMANENT_REDIRECT = 308;
  
  uint constant CLIENT_ERROR = 400; // 4xx
  uint constant BAD_REQUEST = 400;
  uint constant UNAUTHORIZED = 401;
  uint constant PAYMENT_REQUIRED = 402;
  uint constant FORBIDDEN = 403;
  uint constant NOT_FOUND = 404;
  uint constant METHOD_NOT_ALLOWED = 405;
  uint constant NOT_ACCEPTABLE = 406;
  uint constant PROXY_AUTHENTICATION_REQUIRED = 407;
  uint constant REQUEST_TIMEOUT = 408;
  uint constant CONFLICT = 409;
  uint constant GONE = 410;
  uint constant LENGTH_REQUIRED = 411;
  uint constant PRECONDITION_FAILED = 412;
  uint constant REQUEST_ENTITY_TOO_LARGE = 413;
  uint constant REQUEST_URI_TOO_LONG = 414;
  uint constant UNSUPPORTED_MEDIA_TYPE = 415;
  uint constant REQUESTED_RANGE_NOT_SATISFIABLE = 416;
  uint constant EXPECTATION_FAILED = 417;
  uint constant IM_A_TEAPOT = 418;
  uint constant ENHANCE_YOUR_CALM = 420;
  uint constant UNPROCESSABLE_ENTITY = 422;
  uint constant LOCKED = 423;
  uint constant FAILED_DEPENDENCY = 424;
  uint constant UNORDED_COLLECTION = 425;
  uint constant UPGRADE_REQUIRED = 426;
  uint constant TOO_MANY_REQUESTS = 429;
  uint constant REQUEST_HEADER_FIELDS_TOO_LARGE = 431;
  uint constant NO_RESPONSE = 444;
  uint constant BLOCKED_BY_WINDOWS_PARENTAL_CONTROLS = 450;
  uint constant UNAVAILABLE_FOR_LEGAL_REASONS = 451;
  uint constant REQUEST_HEADER_TOO_LARGE = 494;
  
  uint constant SERVER_ERROR = 500; // 5xx
  uint constant INTERNAL_SERVER_ERROR = 500;
  uint constant NOT_IMPLEMENTED = 501;
  uint constant BAD_GATEWAY = 502;
  uint constant SERVICE_UNAVAILABLE = 503;
  uint constant GATEWAY_TIMEOUT = 504;
  uint constant VARIANT_ALSO_NEGOTIATES = 506;
  uint constant INSUFFICIENT_STORAGE = 507;
  uint constant LOOP_DETECTED = 508;
  uint constant BANDWIDTH_LIMIT_EXCEEDED = 509;
  uint constant NOT_EXTENDED = 510;
  uint constant NETWORK_AUTHENTICATION_REQUIRED = 511;
  uint constant NETWORK_READ_TIMEOUT_ERROR = 598;
  uint constant NETWORK_CONNECTION_TIMEOUT_ERROR = 599;
}
