export async function api(path, method = 'GET', body) {
  const isFormData = body instanceof FormData;

  const options = {
    method,
    credentials: 'include',
  };

  if (body !== undefined) {
    if (isFormData) {
      options.body = body;
    } else {
      options.headers = {
        'Content-Type': 'application/json',
      };

      options.body = JSON.stringify(body);
    }
  }

  const res = await fetch('/api' + path, options);

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error || 'Something went wrong. Please try again.'
    );
  }

  return data;
}