import { assertEquals } from "@std/assert";
import { GetElapsedTime } from "../src/functions/date.ts";

Deno.test({
    name: "elapsed time works",
    fn: () => {
        const date = new Date();
        date.setMinutes(date.getMinutes() - 3);
        date.setSeconds(date.getSeconds() - 35);

        assertEquals(
            GetElapsedTime(date),
            "3m 35s",
        );
    },
});
