import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "~/utils/auth";

export const getUserInfoFn = createServerFn().handler(async () => {
  const data = await getCurrentUser();
  return data;
});

export function useAuth() {
  const userInfo = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfoFn(),
  });

  return userInfo.data?.user;
}
