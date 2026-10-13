# Claude Code setup for morluto/rea

Files to drop into the root of a `morluto/rea` checkout (needs push access or a fork):

    cp -a CLAUDE.md .claude /path/to/rea/

`.claude/skills` is a symlink to `../.agents/skills`, which exists in rea. Not tested end to end.
