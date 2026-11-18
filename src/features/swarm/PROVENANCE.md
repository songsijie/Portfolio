# 1、Provenance

[简体中文](provenance.zh-CN.md)

The effect is inspired by [DhvanilPatel/swarm-cursors](https://github.com/DhvanilPatel/swarm-cursors), whose README credits the original visual and motion design to [Joel Califa's Swarm](https://califa.github.io/swarm-site/) and its [public repository](https://github.com/califa/swarm-site). This skill puts scene, animation and interaction code into the user's own project, where the page runs it directly.

The template consists of editable React source organized and rebuilt from this project, with module boundaries, scoped styles and host action handling. It is not the original author's unpublished component project or a launcher that downloads the original site's production bundle. It contains no compressed original React runtime, `node_modules` or local machine paths. React, Vite and other dependencies retain their own licenses; this statement grants no rights to upstream brands, graphics or reference material.

# 2、Maintenance

`assets/template/` is a standalone snapshot; subsequent changes to the demo do not automatically update it. Synchronize applicable module and API changes into the skill while preserving style isolation and injectable parameters. The skill needs no cloud service or account key. External fonts may be replaced with local fonts.

# 3、License status

The `DhvanilPatel/swarm-cursors` README states that it currently has no license and that parts of its animation engine were adapted from the original Swarm site, which has no stated license. This does not establish that all files in this repository came from the reference repository, and it does not grant rights to that code.

This project is distributed under the MIT License. That license applies to rights the project can grant and does not grant rights to third-party material. The precise relationship between this source and the reference implementation remains to be confirmed by the maintainer.
