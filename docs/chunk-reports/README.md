# Chunk Completion Reports

Every chunk commit must include a report file `docs/chunk-reports/chunk-NN.md` **in the same commit**.

## Report template

```markdown
# Chunk NN: <title>

- Commit SHA: <full SHA>
- `git diff --stat`:
  <paste verbatim>
- New test files: <paths>
- Test count before: <N> / after: <N>
- Targeted test results: <pass/fail>
- `npm run lint`: <result>
- `npm run typecheck`: <result>
- `npm test`: <result>
- `npm run build`: <result>
- Deferred items: <what is explicitly not implemented>
- Known limitations: <honest assessment>
```
