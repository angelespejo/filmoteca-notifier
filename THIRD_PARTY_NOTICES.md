# Third-party notices

This project is distributed under the MIT license. It depends on third-party packages
whose licenses remain in effect:

| Package | License |
|---|---|
| `node-cron` | ISC |
| `node-html-parser` | MIT |
| `nodemailer` | MIT-0 |

When distributing a built Docker image, keep the license files shipped with the installed
packages. The Dockerfile copies them into `THIRD_PARTY_LICENSES/`.

The full license texts are also available in the corresponding package directories under
`node_modules/` after installing dependencies.
