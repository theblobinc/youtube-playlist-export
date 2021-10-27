import c from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { getPlaylistData, getPlaylistMetadata } from "../lib/api.js";
import Config from "../lib/Config.js";
import { exportOptionsPrompts } from "../lib/prompts.js";
import saveFile from "../utils/saveFile.js";

/**
 * Action handler for `ytpl-export id [options] <playlistId>`
 * @param {string} playlistId   Command argument - ID of playlist to be exported
 * @param {{default: boolean}} options  Command options
 */
const idActionHandler = async (playlistId, options) => {
  const config = new Config();

  // Check for "Watch Later"
  if (playlistId === "WL") {
    // prettier-ignore
    console.log(c.yellow("WARNING: Videos in Watch Later playlist cannot be retrieved through the YouTube API."));
    console.log(c.yellow("Please try another playlist."));
    return;
  }

  // Check if API key exists
  if (!config.get("apiKey")) {
    console.log(`${c.yellow("WARNING:")} You haven't set your YouTube API key!`);
    console.log(`Run ${c.cyan("`ytpl-export key`")} to set the API key.`);
    return;
  }

  // Fetch playlist metadata
  const metaSpinner = ora("Fetching playlist metadata...").start();
  let metadata;

  try {
    metadata = await getPlaylistMetadata(playlistId);
    metaSpinner.succeed("Fetched playlist metadata");
  } catch (error) {
    metaSpinner.fail("Failed in fetching playlist metadata");
    handleApiError(error);
    return;
  }

  console.log(`▶ Playlist Title: ${c.blueBright(metadata.title)}`);
  console.log(
    `▶ Number of videos (including private videos): ${c.blueBright(metadata.numOfVideos)}\n`
  );

  // Check if playlist is empty
  if (metadata.numOfVideos === 0) {
    console.log(c.green("This playlist is empty and there are no video data to export."));
    return;
  }

  let playlistData;
  const saveFileOptions = {
    fileExt: config.get("fileExt"),
    folderPath: config.get("folderPath"),
    playlistTitle: metadata.title,
  };

  // User prompt
  if (options.default) {
    // Skip all prompts for `--default` option
    const exportItems = config.getExportItemsDefaults();
    playlistData = await getPlaylistData(playlistId, exportItems, metadata.numOfVideos);
  } else {
    const input = await inquirer.prompt(exportOptionsPrompts());
    console.log("");

    saveFileOptions.fileExt = input.fileExt;
    saveFileOptions.folderPath = input.folderPath;

    // Fetch playlist data
    try {
      playlistData = await getPlaylistData(playlistId, input.exportItems, metadata.numOfVideos);
    } catch (error) {
      console.log("");
      handleApiError(error);
      return;
    }
  }

  console.log("");
  saveFile(playlistData, saveFileOptions);
};

/**
 * Handle error from fetching YouTube API.
 * @param {Error} error
 */
function handleApiError(error) {
  const { status, reason } = JSON.parse(error.message);

  switch (reason) {
    case "quotaExceeded":
      // prettier-ignore
      console.error(c.red(`ERROR (${status}): Your API key has exceeded the daily quota of 10,000 units.`));
      // prettier-ignore
      console.error(c.red("You cannot export more data until tomorrow when the quote usage resets."));
      break;
    case "playlistNotFound":
      console.error(c.red(`ERROR (${status}): Playlist cannot be found.`));
      console.error(c.red("This may be because the playlist visibility is set to private."));
      break;
    default:
      console.error(c.red(`ERROR (${status} ${reason}): Something went wrong. Please try again!`));
      break;
  }
}

export default idActionHandler;