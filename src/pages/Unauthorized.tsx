import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">
        Unauthorized
      </h1>
      <p className="mb-4">
        You do not have permission to access this page.
      </p>
      <Link
        to="/login"
        className="text-blue-600 underline"
      >
        Go to Login
      </Link>
    </div>
  );
};

export default Unauthorized;
