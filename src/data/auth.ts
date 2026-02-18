export const register = async (
  email: string,
  password: string,
  name: string,
  role: string
) => {
  const response = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name, role }),
  });
  return response.json();
};

export const login = async (email: string, password: string) => {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Login failed");
  }
  const token = data?.data?.accessToken;
  if (token) {
    localStorage.setItem("token", token);
  }
  return data;
};

export const logout = async () => {
  const accessToken = localStorage.getItem("token");
  const response = await fetch("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  localStorage.removeItem("token");
  return response.json();
};

// get user profile

export const getUserProfile = async () => {
  const accessToken = localStorage.getItem("token");
  const response = await fetch("http://localhost:3000/api/auth/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (data.success === true) {
    return data;
  } else {
    throw new Error(data.message);
  }
};
