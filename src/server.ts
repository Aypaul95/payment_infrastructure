
import { app } from "./app";

const PORT = 3000;

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Payment Infrastructure API running at http://127.0.0.1:${PORT}`,
  );
});