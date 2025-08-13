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

        const date2 = new Date();
        date2.setMinutes(date2.getMinutes() - 1);
        date2.setSeconds(date2.getSeconds() - 5);

        assertEquals(
            GetElapsedTime(date2),
            "1m 05s",
        );
    },
});
