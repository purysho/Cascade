# Local composition

The canonical /brag creative plan lives one level up. This project uses the same inspect → storyboard → composition → render structure, but the final composition is rendered by tools/render-brag.mjs with FFmpeg rather than Hyperframes because the Hyperframes package is not installed in the execution environment.

The renderer only consumes real Cascade screenshots produced by npm run launch:capture. No mock product UI is substituted.
