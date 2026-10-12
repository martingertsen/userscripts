# Userscripts

Tampermonkey userscripts by Martin Gertsen. Small fixes for the sites I use every day.

**Install page:** https://martingertsen.github.io/userscripts/

The page lists every script in this repository with its description and a one-click install link. It reads the scripts directly from the repository, so it needs no updating when scripts are added or changed.

## Scripts

| Script | Sites | Description |
| --- | --- | --- |
| [Imgur: Classic design](imgurclassic.user.js) | imgur.com | Forces the classic design and adds fixes: 500 character comment limit, numbered gallery images, fixed HTML escape sequences, vote counts on comments, hidden mobile badges and visible line breaks in comments. |
| [Discuit: Gallery Controls](discuitgallerycontrols.user.js) | discuit.org, discuit.net | Moves the gallery controls below the images, shows the current image number and lets you flip through galleries by clicking the image edges. |
| [YouTube Music: Auto Continue](youtubemusicautocontinue.user.js) | music.youtube.com | Automatically confirms the "Still listening?" prompt. |

## Installing manually

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open the raw URL of a script, for example https://raw.githubusercontent.com/martingertsen/userscripts/main/imgurclassic.user.js
3. Tampermonkey shows the source and asks you to confirm the install.

Scripts update automatically through their `@updateURL`.

## Credits

Several scripts build on work by others. Each script lists its original authors and sources in a comment below the header.

## License

MIT
