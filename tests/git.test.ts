import { assertEquals } from "@std/assert";
import { GenerateGitUrl } from "../src/commands/toolkit/git-url.ts";

Deno.test({
    name: "properly generates git urls",
    fn: () => {
        assertEquals(GenerateGitUrl("https://github.com/user/repo.git").full, "https://github.com/user/repo.git");
        assertEquals(GenerateGitUrl("https://github.com/jonathan/my-framework.gi").full, "https://github.com/jonathan/my-framework.git");
        assertEquals(GenerateGitUrl("https://github.com/user/repo..").full, "https://github.com/user/repo.git");
        assertEquals(GenerateGitUrl("https://gitlab.com/user/dots...git").full, "https://gitlab.com/user/dots.git");
        assertEquals(GenerateGitUrl("https://github.com/user/dots...tig").full, "https://github.com/user/dots.git");
        assertEquals(GenerateGitUrl("https://github.com/user/repo.test").full, "https://github.com/user/repo.test.git");

        assertEquals(GenerateGitUrl("gh:user/repo").full, "https://github.com/user/repo.git");
        assertEquals(GenerateGitUrl("gh:user/repo/").full, "https://github.com/user/repo.git");
        assertEquals(GenerateGitUrl("gh:user/repo.").full, "https://github.com/user/repo.git");
        assertEquals(GenerateGitUrl("bb:user/repo").full, "https://bitbucket.org/user/repo.git");
        assertEquals(GenerateGitUrl("gl:me/code...").full, "https://gitlab.com/me/code.git");

        assertEquals(GenerateGitUrl("gh:user/cool-repo").name, "cool-repo");
        assertEquals(GenerateGitUrl("https://github.com/user/cool-repo..git").name, "cool-repo");
    },
});
