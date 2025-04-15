import { Link } from "@tanstack/react-router";

export const Navbar = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <>
      <header className="px-5 max-w-7xl mx-auto flex items-center justify-between py-5">
        <Link to="/" className="text-3xl font-bold">
          TS
        </Link>

        <nav>
          <ul className="flex items-center gap-5">
            <li>
              <Link to="/">Home</Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/todos">Todos</Link>
                </li>
                <li>
                  <Link to="/logout">Logout</Link>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login">Login</Link>
              </li>
            )}
          </ul>
        </nav>
      </header>
    </>
  );
};
