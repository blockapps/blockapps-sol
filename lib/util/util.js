// TODO: Remove If not in use
const getCredentialArgs = function (uid, name, password) {
  const username = `${name}_${uid}`;

  return {
    username,
    password
  };
}

export {
  getCredentialArgs
}
