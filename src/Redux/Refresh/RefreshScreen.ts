import axios from "axios";
import { RefreshScreenApi } from "../../API/API";

type Vars = { screenId: string };

export async function refreshScreen({ screenId }: Vars) {
  const token = localStorage.getItem("token") || "";
  const url = `${RefreshScreenApi}/${screenId}`;

  const res = await axios.post(
    url,
    {}, // ✅ body (empty)
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return res.data;
}
