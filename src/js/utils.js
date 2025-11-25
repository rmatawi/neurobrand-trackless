import axios from "axios";
import uuid4 from "uuid4";
import _ from "lodash";

// VITE_REACT_APP_OPENAI_API_KEY
const openaiApiKey = (import.meta && import.meta.env && import.meta.env.VITE_REACT_APP_OPENAI_API_KEY) || null;

export const kbToMb = (kb) => (kb / 1024).toFixed(2); // Round to 2 decimal places
export const bytesToMb = (bytes) => (bytes / (1024 * 1024)).toFixed(2); // Rounded to 2 decimal places

export const popupIcons = {
  selectsingle: "checkmark_circle",
  selectmultiple: "checkmark_square",
  slidergroup: "slider_horizontal_3",
  rating: "smallcircle_fill_circle",
  starrating: "star",
  text: "textformat_abc",
  number: "textformat_123",
  date: "calendar",
  time: "clock",
  textarea: "text_quote",
  homemenu: "house",
  reminder: "calendar",
  clickable: "rectangle_grid_2x2",
  chapter: "bookmark",
  start: "play",
  optin: "person",
  registration: "phone",
};

export const goto = {
  reset: "Start Over",
  auto: "Continue Video",
  eof: "External Link",
  socialshare: "Share Video",
  emailme: "Email Me",
  callme: "Call Me",
  whatsappme: "Whatsapp Me",
  fbmessageme: "FbMessage Me",
  textme: "Text Me",
};

export function removeSpecialChars(str) {
  str = str.replace(/[^\w\s]/gi, "");
  // str = str.replace( /(?<!\p{L})\p{L}|\s+/gu,m => +m === 0 ? "" : m.toUpperCase() ).replace( /^./, m => m?.toLowerCase() );
  // str = str.replace(' ', '');
  // return str;
  let newStr = "";
  if (str) {
    let wordArr = str.split(/[-_]/g);
    for (let i in wordArr) {
      if (i > 0) {
        newStr += wordArr[i].charAt(0).toUpperCase() + wordArr[i].slice(1);
      } else {
        newStr += wordArr[i];
      }
    }
  } else {
    return newStr;
  }
  return newStr;
}

export function webfontloader(font) {
  /*
   * Web Font Loader:
   * https://github.com/typekit/webfontloader
   *
   */

  var body = document.querySelector("body");
  // var fontSelect = document.querySelectorAll('[data-font]');

  // Load a Google font by name.
  var loadFont = function (font) {
    WebFont.load({
      google: {
        families: [font],
      },
    });
  };

  // Add an event listener for each button.
  // When a button is clicked, get the font name, load the font, and set the new font family.
  // for (var i = 0; i < fontSelect.length; i++) {
  // fontSelect[i].addEventListener('click', function () {
  // var font = this.getAttribute('data-font');
  loadFont(font);
  body.style.fontFamily = font;
  // document.getElementById("comment_output").innerHTML = document.getElementById("comment_input").value
  // });
  // }
}

export function getSizeInKB(object) {
  // Convert object to a string
  const objectAsString = JSON.stringify(object);
  // Get the length of the string
  const lengthInBytes = objectAsString.length;
  // Convert length to kilobytes (1 kb = 1024 bytes)
  const lengthInKB = lengthInBytes / 1024;
  // Round to 2 decimal places
  return Math.round(lengthInKB * 100) / 100;
}

export function secondsToHms(d = 0) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);

  var mDisplay = m > 9 ? m : "0" + m;
  var sDisplay = s > 9 ? s : "0" + s;
  // return hDisplay + ":" + mDisplay + ":" + sDisplay;
  return mDisplay + ":" + sDisplay;
}

export function secondsToHmsShort(d = 0) {
  if (d == 0) {
    return 0;
  }
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);
  var hDisplay = h > 0 ? h.toString().padStart(2, "0") + ":" : "";
  var mDisplay = m > 0 ? m.toString().padStart(2, "0") + ":" : "";
  var sDisplay = s > 0 ? s.toString().padStart(2, "0") : "";
  return hDisplay + mDisplay + sDisplay;
}

export function keepNumbers(str) {
  let res = "";
  try {
    res = str.replace(/[^0-9]/g, "");
  } catch (error) {
    res = str;
  }
  return res;
}

export function extractTimecode(timecode = "timecode:0") {
  /*
    let res = 0;
    try {
        res = timecode.replace(/\D+/g, '');
    } catch (error) {
        res = 0;
    }
    return res === '' ? 0 : parseInt(res);
    */

  if (typeof timecode === "number") {
    return timecode;
  }

  if (typeof timecode === "string") {
    const regex = /\d+/; // Matches one or more digits
    const matches = timecode.match(regex);

    if (matches && matches.length > 0) {
      return parseInt(matches[0]);
    }
  }

  return NaN; // Return NaN if no number value is found
}

export function convertStringToArray(input) {
  return input
    .split(/[^\d]+/)
    .map((num) => parseInt(num))
    .filter((num) => !isNaN(num));
}

export function removeSpecialCharacters(str) {
  return str.replace(/[^\w\s]/gi, "").replace(/\s+/g, "");
}

export function formatTime(input) {
  const times = input
    .split(/\band\b|,|\s/)
    .map((time) => parseInt(time))
    .filter((time) => !isNaN(time));
  return times.map((time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  });
}

export function groupAndCount(array) {
  const result = {};
  for (const obj of array) {
    for (const key in obj) {
      if (key in result) {
        result[key][obj[key]] = (result[key][obj[key]] || 0) + 1;
      } else {
        result[key] = { [obj[key]]: 1 };
      }
    }
  }
  return result;
}

export function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function convertJson(input) {
  let result = [];

  try {
    if (typeof input === "number") {
      result.push(input);
    } else if (typeof input === "string") {
      result = JSON.parse(input);
      if (!Array.isArray(result)) {
        result = [result]; // Encapsulate non-array JSON objects into an array
      }
    } else {
      result.push(input);
    }
  } catch (error) {
    result.push(input);
  }

  return result;
}

export function customJoin(str, char) {
  try {
    str = JSON.parse(str);
    str = str.join(char);
    return str;
  } catch (error) {
    return [str];
  }
}

export function classIsRendered(classname) {
  const elements = document.querySelectorAll(classname);

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    // Check if the element is visible
    if (element.offsetWidth > 0 && element.offsetHeight > 0) {
      return true;
    }
  }

  return false;
}

export function toTitleCase(str) {
  if (typeof str !== "string" || str.length === 0) {
    return "";
  }

  return str.replace(/\b\w+/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export function keepOnlyTextNumberDash(str) {
  return str.replace(/[^0-9a-zA-Z\-]+/g, "").toLowerCase();
}

export function detectMedia(inputString) {
  // Regular expressions for each platform
  const youtubeRegex =
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/i;
  const vimeoRegex = /vimeo\.com\/(\d+)/i; //OK
  const wistiaRegex = /wistia\.com\/(?:medias|embed)\/([\w-]+)/i; //OK
  const vidyardRegex = /vidyard\.com\/(?:watch|embed)\/([\w-]+)/i; //OK
  const cloudinaryRegex = /res\.cloudinary\.com\/[\w-]+\/video\/upload/i; //OK

  // Regular expressions for the additional sources
  const soundcloudRegex = /soundcloud\.com/i; //OK
  const twitchRegex = /twitch\.tv/i; //OK
  const dailymotionRegex =
    /(?:dailymotion\.com\/video\/|dai\.ly\/|geo\.dailymotion\.com\/player\.html\?video=)([\w-]+)/i;

  // Regular expressions for the additional filetypes
  const mp4Regex = /\.mp4$/i;
  const webmRegex = /\.webm$/i;
  const ogvRegex = /\.ogv$/i;
  const mp3Regex = /\.mp3$/i;

  if (youtubeRegex.test(inputString)) {
    return "youtube";
  } else if (vimeoRegex.test(inputString)) {
    return "vimeo";
  } else if (wistiaRegex.test(inputString)) {
    return "wistia";
  } else if (dailymotionRegex.test(inputString)) {
    return "dailymotion";
  } else if (vidyardRegex.test(inputString)) {
    return "vidyard";
  } else if (cloudinaryRegex.test(inputString)) {
    return "cloudinary";
  } else if (soundcloudRegex.test(inputString)) {
    return "soundcloud";
  } else if (twitchRegex.test(inputString)) {
    return "twitch";
  } else if (mp4Regex.test(inputString)) {
    return "mp4";
  } else if (webmRegex.test(inputString)) {
    return "webm";
  } else if (ogvRegex.test(inputString)) {
    return "ogv";
  } else if (mp3Regex.test(inputString)) {
    return "mp3";
  } else {
    alert("Videosource not supported" + inputString);
    return "unknown";
  }
}

export function generateRandomFileName(nr = 10) {
  const alphanumericPart =
    Math.random().toString(36).substring(2, nr) +
    Math.random().toString(36).substring(2, nr);
  return alphanumericPart;
}

export function isDailyMotion(url) {
  const dailyMotionPattern = /(?:dailymotion\.com|dai\.ly)/;
  return dailyMotionPattern.test(url);
}

export function getDailyMotionId(url) {
  const regex = /(?:dailymotion\.com\/(?:video|hub)\/([^_]+)|dai\.ly\/([^_]+))/;
  const matches = url.match(regex);
  return matches ? matches[1] || matches[2] : null;
}

export function videoAllowed(inputString) {
  const allowedSources = [
    ".mp4",
    "cloudinary.com",
    "dai.ly",
    "dailymotion.com",
    "dropbox.com",
    "wistia.com",
    "soundcloud.com",
    "streamable.com",
    "test-videos.co.uk",
    "twitch.tv",
    "vidyard.com",
    "vimeo.com",
    "youtu.be",
    "youtube.com",
  ];

  for (let i = 0; i < allowedSources.length; i++) {
    if (inputString.includes(allowedSources[i])) {
      return true;
    }
  }
  alert(
    `Only the following video formats and hosting services are allowed: ${allowedSources.join(
      ", "
    )}.`
  );
  return false;
}

export function formatDateYYMMDD(str) {
  if (str != "") {
    const date = new Date(str);
    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = date.toLocaleDateString("en-US", options);
    return formattedDate;
  }
  return str;
}

export function formatDateElapsed(str) {
  if (str !== "") {
    const now = new Date();
    const date = new Date(str);
    const elapsedTime = now - date;

    // Calculate time differences
    const seconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30); // Approximate months
    const years = Math.floor(days / 365); // Approximate years

    if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
    if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
  }
  return str;
}

export function textMore(str, length = 50) {
  if (!str) return;
  let res = "";
  try {
    res = str.substring(0, 50) + (str.length > 50 ? "..." : "");
  } catch (error) {
    return "";
  }
  return res;
}

export function convertUnixTimestampToMMDDYYYY(timestamp) {
  // Create a new Date object and set its time using the Unix timestamp
  const date = new Date(timestamp * 1000); // Multiply by 1000 to convert seconds to milliseconds

  // Get the individual components of the date (month, day, and year)
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  // Combine the components into the desired format
  const formattedDate = `${month}-${day}-${year}`;

  return formattedDate;
}

export function convertDateFormat(inputDateString) {
  // Parse the input date string
  const inputDate = new Date(inputDateString);

  // Extract date components
  const month = (inputDate.getMonth() + 1).toString().padStart(2, "0");
  const day = inputDate.getDate().toString().padStart(2, "0");
  const year = inputDate.getFullYear();

  // Extract time components
  const hours = inputDate.getHours().toString().padStart(2, "0");
  const minutes = inputDate.getMinutes().toString().padStart(2, "0");
  const seconds = inputDate.getSeconds().toString().padStart(2, "0");

  // Format the result
  const result = `${month}-${day}-${year}, ${hours}:${minutes}:${seconds}`;

  return result;
}

export function formatDate(dateString) {
  // Extract year, month, and day from the input string
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);

  // Create a Date object to get the month name in short form
  const date = new Date(`${year}-${month}-${day}`);
  const monthName = date.toLocaleString("en-US", { month: "short" });

  // Combine the month name and day, padding the day with a leading zero if necessary
  return `${monthName}${day.padStart(2, "0")}`;
}

export function padNumber(num) {
  if (num < 10) {
    return "0" + num;
  } else {
    return num.toString();
  }
}

export function IsDesktop() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile =
    /iphone|ipod|ipad|android|blackberry|windows phone|webos|iemobile|opera mini/i.test(
      userAgent
    );
  return !isMobile;
}

export function passCodeGenerator(n = 6) {
  // GENERATE 6 DIGIT NUMBER
  let gen = (n) => "x".repeat(n).replace(/x/g, () => (Math.random() * 10) | 0);
  // FIRST NUMBER CAN'T BE ZERO - SO WE GENERATE IT SEPARATLEY
  let sixDigitStr = ((1 + Math.random() * 9) | 0) + gen(n - 1);
  return +sixDigitStr;
}

function stripHTMLTags(text) {
  var div = document.createElement("div");
  div.innerHTML = text;
  return div.textContent || div.innerText || "";
}

function splitParagraphIntoSentences(paragraph) {
  // Define common sentence-ending punctuation marks
  const sentenceEnders = [".", "!", "?"];

  // Remove leading/trailing white space and split the paragraph into an array of words
  const words = paragraph.trim().split(" ");

  // Initialize variables
  let sentences = [];
  let currentSentence = "";

  // Iterate over each word
  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Add the word to the current sentence
    currentSentence += word + " ";

    // Check if the word ends with a sentence-ending punctuation mark
    if (sentenceEnders.some((ender) => word.endsWith(ender))) {
      // Remove trailing white space and add the current sentence to the array of sentences
      sentences.push(currentSentence.trim());

      // Reset the current sentence
      currentSentence = "";
    }
  }

  // If there's still a sentence remaining, add it to the array of sentences
  if (currentSentence) {
    sentences.push(currentSentence.trim());
  }

  return sentences;
}

export function extractQuestionsBAK(paragraph) {
  let questions = [];
  paragraph = stripHTMLTags(paragraph);
  let sentences = splitParagraphIntoSentences(paragraph);
  questions = sentences.filter((item) => item.includes("?"));
  return questions;
}

export function extractQuestions(inputString) {
  inputString = stripHTMLTags(inputString);

  // Use a regular expression to match sentences ending with a question mark
  var questionRegex = /[^.!?]*\?/g;

  // Use match method to find all matches in the input string
  var questions = inputString.match(questionRegex);

  return questions;
}

export function getScreenWidth() {
  return (
    document.body.clientWidth ||
    window.innerWidth ||
    document.documentElement.clientWidth
  );
}

export async function ChatGPT_OK({ prompt, mode = "smartscript" }) {
  // If no API key is available, return a mock response
  if (!openaiApiKey) {
    console.warn("VITE_REACT_APP_OPENAI_API_KEY not configured, returning mock response");
    return new Promise((resolve) => {
      resolve({
        content: "Mock response for: " + prompt.substring(0, 50) + "...",
        usage: 1,
      });
    });
  }

  console.log("Please wait"); // Using console.log instead of preloader, implement proper loading state in React components as needed
  return new Promise(async (resolve) => {
    const buildformSystem =
      "Response output format:\n\n" +
      "Question 1: Lorem ipsum?\n" +
      // "A: Lorem ipsum\n"+
      // "B: Lorem ipsum\n"+
      // "C: Lorem ipsum\n"+
      // "D: Lorem ipsum\n"+
      "Question 2: Lorem ipsum?\n" +
      // "A: Lorem ipsum\n"+
      // "B: Lorem ipsum\n"+
      // "C: Lorem ipsum\n"+
      // "D: Lorem ipsum\n"+
      "etc";

    const smartScriptSystem =
      "Response output format:\n\n" +
      "Narrator: Lorem ipsum.\n" +
      "Question 1: Lorem ipsum?\n" +
      // "A: Lorem ipsum\n"+
      // "B: Lorem ipsum\n"+
      // "C: Lorem ipsum\n"+
      // "D: Lorem ipsum\n"+
      "Narrator: Lorem ipsum.\n" +
      "Question 2: Lorem ipsum?\n" +
      // "A: Lorem ipsum\n"+
      // "B: Lorem ipsum\n"+
      // "C: Lorem ipsum\n"+
      // "D: Lorem ipsum\n"+
      "etc";

    const roles = {
      buildform: buildformSystem,
      smartscript: smartScriptSystem,
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    };

    const data = {
      // model: "gpt-3.5-turbo-16k",
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: roles[mode],
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 1,
      max_tokens: 8500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    await axios
      .post("https://api.openai.com/v1/chat/completions", data, { headers })
      .then((response) => {
        // f7.dialog.close(); // Removed Framework7 dependency
        resolve({
          content: response.data.choices[0].message.content,
          usage: response.data.usage,
        });
      })
      .catch(() => {
        // f7.dialog.close(); // Removed Framework7 dependency
        setTimeout(() => {
          alert("Please try again"); // Replaced f7.dialog.alert with alert
        }, 500);
      });
  });
}

export async function ChatGPT({ prompt, mode = "smartscript" }) {
  const apiKey = (import.meta && import.meta.env && import.meta.env.VITE_REACT_GEMINI_API) || null;

  // If no API key is available, return a mock response
  if (!apiKey) {
    console.warn("VITE_REACT_GEMINI_API not configured, returning mock response");
    return new Promise((resolve) => {
      resolve({
        content: "Mock response for: " + prompt.substring(0, 50) + "...",
        usage: 1,
      });
    });
  }

  console.log("Please wait"); // Using console.log instead of preloader, implement proper loading state in React components as needed
  return new Promise(async (resolve) => {
    const buildformSystem =
      "Response output format:\n\n" +
      "Question 1: Lorem ipsum?\n" +
      "Question 2: Lorem ipsum?\n" +
      "etc";

    const smartScriptSystem =
      "Response output format:\n\n" +
      "Narrator: Lorem ipsum.\n" +
      "Question 1: Lorem ipsum?\n" +
      "Narrator: Lorem ipsum.\n" +
      "Question 2: Lorem ipsum?\n" +
      "etc";

    const roles = {
      buildform: buildformSystem,
      smartscript: smartScriptSystem,
    };

    const conversationHistoryTrimmed = [
      {
        role: "model",
        parts: [
          {
            text: roles[mode],
          },
        ],
      },
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const data = {
      contents: conversationHistoryTrimmed,
      safetySettings: [
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
      generationConfig: {
        stopSequences: ["Title"],
        temperature: 1.0,
        maxOutputTokens: 800,
        topP: 0.8,
        topK: 10,
      },
    };

    await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
      .then((response) => response.json())
      .then((response) => {
        // f7.dialog.close(); // Removed Framework7 dependency
        resolve({
          content: response?.candidates?.[0]?.content.parts?.[0]?.text, // Adjusted response structure
          usage: 1,
        });
      })
      .catch(() => {
        // f7.dialog.close(); // Removed Framework7 dependency
        setTimeout(() => {
          alert("Please try again"); // Replaced f7.dialog.alert with alert
        }, 500);
      });
  });
}

export function formatSmartScript(inputString = "") {
  // Initialize an array to store the output
  const outputArray = [];

  try {
    // Split the input into individual sections based on the "Narrator" keyword
    const sections = inputString.split("Narrator: ");

    const sectionsCorrected = [];

    sections.map((item) => {
      sectionsCorrected.push("Narrator: " + item);
    });

    // Remove the first empty string element in the array
    sectionsCorrected.shift();

    // Iterate through each section to extract information
    let questionNumber = 1;
    for (const section of sectionsCorrected) {
      const outputObj = {};

      // Extract narrator information
      const narratorMatch = section.match(/Narrator: (.*)\n/);
      outputObj.narrator = narratorMatch ? narratorMatch[1] : "";

      // Extract question information
      const pattern = new RegExp(`Question ${questionNumber}: (.*)\\n`);
      const questionMatch = section.match(pattern);
      outputObj.question = questionMatch ? questionMatch[1] : "";

      // Extract answer choices
      let answers = [];

      const choicesMatchA = section.match(/A: (.*)\n/);
      if (choicesMatchA?.[1]) {
        answers.push(choicesMatchA[1]);
      }

      const choicesMatchB = section.match(/B: (.*)\n/);
      if (choicesMatchB?.[1]) {
        answers.push(choicesMatchB[1]);
      }

      const choicesMatchC = section.match(/C: (.*)\n/);
      if (choicesMatchC?.[1]) {
        answers.push(choicesMatchC[1]);
      }

      const choicesMatchD = section.match(/D: (.*)\n/);
      if (choicesMatchD?.[1]) {
        answers.push(choicesMatchD[1]);
      }

      // Push the output object to the output array
      outputArray.push({
        ...outputObj,
        answers,
        subject: removeSpecialCharacters(toTitleCase(outputObj.question)),
      });

      questionNumber++;
    }
  } catch (error) {
    console.debug("error");
  }

  return outputArray;
}

export function formatManualScript(inputString = "") {
  let questions = [];
  try {
    inputString = stripHTMLTags(inputString);
    inputString = inputString.split(".");
    inputString.map((line) => {
      if (line.includes("?")) {
        line = line.split("?");
        line = line[0].replace(/\n/g, "");
        questions.push(line + "?");
      }
    });
  } catch (error) {
    console.debug("error");
  }
  return questions;
}

export function formatQuickStart(inputString = "") {
  // Split the input into individual sections based on the "Narrator" keyword
  const sections = inputString.split("Question ");

  const sectionsCorrected = [];

  sections.map((item) => {
    sectionsCorrected.push("Question " + item);
  });

  // Remove the first empty string element in the array
  sectionsCorrected.shift();

  // Initialize an array to store the output
  const outputArray = [];

  // Iterate through each section to extract information
  let questionNumber = 1;
  for (const section of sectionsCorrected) {
    const outputObj = {};

    // Extract question information
    const pattern = new RegExp(`Question ${questionNumber}: (.*)\\n`);
    const questionMatch = section.match(pattern);
    outputObj.question = questionMatch ? questionMatch[1] : "";

    // Extract answer choices
    let answers = [];

    const choicesMatchA = section.match(/A: (.*)\n/);
    if (choicesMatchA?.[1]) {
      answers.push(choicesMatchA[1]);
    }

    const choicesMatchB = section.match(/B: (.*)\n/);
    if (choicesMatchB?.[1]) {
      answers.push(choicesMatchB[1]);
    }

    const choicesMatchC = section.match(/C: (.*)\n/);
    if (choicesMatchC?.[1]) {
      answers.push(choicesMatchC[1]);
    }

    const choicesMatchD = section.match(/D: (.*)\n/);
    if (choicesMatchD?.[1]) {
      answers.push(choicesMatchD[1]);
    }

    // Push the output object to the output array
    outputArray.push({
      ...outputObj,
      answers,
      subject: removeSpecialCharacters(toTitleCase(outputObj.question)),
    });

    questionNumber++;
  }

  return outputArray;
}

function checkoptionType(str) {
  if (
    str.indexOf("icon:") === -1 &&
    str.indexOf("emoji:") === -1 &&
    str.indexOf("image:") === -1 &&
    str.indexOf("hotspot:") === -1 &&
    str.indexOf("qrcode:") === -1 &&
    str.indexOf("spacer:") === -1
  ) {
    return "button";
  } else {
    // If any of the substrings are found, return undefined or null
    return null; // You can customize this to return any other value as needed
  }
}

export function getElmType(label) {
  if (checkoptionType(label) === "button") {
    return "button";
  }
  const elmType = label.replace(/:.*/, "");
  console.log({ elmType });
  return elmType;
}

export function urlFormatter(url) {
  let res = url;
  if (url.includes("www.dropbox.com")) {
    res = url.split("?");
    res = res[0] + "?raw=1";
  }
  return res;
}

export function removeDlParameter_BAK(url) {
  // Check if the URL contains the "dl=0" parameter
  if (url.includes("dl=0")) {
    // Remove the "dl=0" parameter from the URL
    const modifiedURL = url.replace(/[\?&]dl=0(&|$)/, "$1");
    return modifiedURL;
  }

  // If the "dl=0" parameter is not present, return the original URL
  return url;
}

export function removeDlParameter(dropboxUrl) {
  // Check if the provided URL is a Dropbox link
  if (dropboxUrl.includes("www.dropbox.com")) {
    dropboxUrl = dropboxUrl.split("dl=0");
    console.debug(dropboxUrl, "DropBox");
    dropboxUrl = dropboxUrl[0];
    console.debug(dropboxUrl, "DropBox");
    dropboxUrl = dropboxUrl + "&raw=1";
    console.debug(dropboxUrl, "DropBox");
    return dropboxUrl;
  } else {
    // If the provided URL is not a Dropbox link, return the original URL
    return dropboxUrl;
  }
}

export function scrollAxisY({
  scrollElementId,
  targetId,
  duration = 1000,
  offset = 0,
}) {
  const container = document.getElementById(scrollElementId);
  const elm = document.getElementById(targetId);
  const start = container.scrollTop;
  const end = elm.offsetTop - offset;
  const distance = end - start;
  let startTime = null;

  function scrollAnimation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const scroll = easeInOutQuad(timeElapsed, start, distance, duration);
    container.scrollTo({ top: scroll });
    if (timeElapsed < duration) window.requestAnimationFrame(scrollAnimation);
  }

  function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }

  window.requestAnimationFrame(scrollAnimation);
}

function sanitizeJSON(jsonString) {
  // Remove trailing commas in objects and arrays
  const sanitizedJSON = jsonString.replace(/,\s*([\]}])/g, "$1");
  return sanitizedJSON;
}
export function convertStringToJson(inputString) {
  inputString = sanitizeJSON(inputString);

  let jsonObject = {};
  // Replace escaped line breaks with a placeholder
  const placeholder = "##LINE_BREAK##";
  let modifiedString = inputString.replace(/\\\n/g, placeholder);

  // Remove newlines
  modifiedString = modifiedString.replace(/[\r\n]+/g, "");

  // Remove extra spaces
  modifiedString = modifiedString.replace(/\s+/g, " ");

  // Remove unnecessary escape characters
  const jsonString = modifiedString.replace(/\n/g, "");

  // Replace the placeholder with actual line breaks
  const jsonWithLineBreaks = jsonString.replace(
    new RegExp(placeholder, "g"),
    "\n"
  );

  try {
    // Parse the JSON string into an object
    jsonObject = JSON.parse(jsonWithLineBreaks);
  } catch (error) {
    try {
      jsonObject = JSON.parse(inputString);
    } catch (error) {
      jsonObject = false;
    }
  }

  return jsonObject;
}

export function convertContentStringToJson(text) {
  // Remove newlines
  text = text.replace(/[\r\n]+/g, "");

  // Remove extra spaces
  text = text.replace(/\s+/g, " ");

  return text;
}

export function deleteDialog(deleteItem) {
  // Framework7 dialog replaced with vanilla JS implementation
  const result = confirm("Are you sure you want to delete this? This cannot be undone.");
  if (result) {
    deleteItem();
  }
}

export function breakToHtml(text) {
  try {
    // return text.replace(/\n/g, '<br>');
    return text.replace(/(\r\n|\r|\n)/g, "<br>");
  } catch (error) {
    return text;
  }
}

export function dragScroll(arg) {
  // Wes Bos video: https://www.youtube.com/watch?v=C9EWifQ5xqA
  const handle = arg.handle;
  const target = arg.target;
  const direction = arg.direction;
  const handler = document.querySelector(handle);
  const container = document.querySelector(target);

  let startY;
  let startX;
  let scrollLeft;
  let scrollTop;
  let isDown;

  handler.addEventListener("mousedown", (e) => mouseIsDown(e));
  handler.addEventListener("mouseup", (e) => mouseUp(e));
  handler.addEventListener("mouseleave", (e) => mouseLeave(e));
  handler.addEventListener("mousemove", (e) => mouseMove(e));

  function mouseIsDown(e) {
    isDown = true;
    startY = e.pageY - container.offsetTop;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
  }
  function mouseUp(e) {
    isDown = false;
  }
  function mouseLeave(e) {
    isDown = false;
  }
  function mouseMove(e) {
    if (isDown) {
      e.preventDefault();
      //Move vertcally
      if ("y".includes(direction)) {
        const y = e.pageY - container.offsetTop;
        const walkY = y - startY;
        container.scrollTop = scrollTop - walkY;
      }

      //Move Horizontally
      if ("x".includes(direction)) {
        const x = e.pageX - container.offsetLeft;
        const walkX = x - startX;
        container.scrollLeft = scrollLeft - walkX;
      }
    }
  }
}

export function getEstimatedReadTime(paragraph) {
  // Split the text into words.
  const words = paragraph.split(" ");

  // Calculate the number of words in the paragraph.
  const wordCount = words.length;

  // Calculate the estimated read time in minutes.
  const estimatedReadTime = Math.ceil(wordCount / 200);

  // Return the estimated read time in seconds.
  return estimatedReadTime * 60;
}

export function GoogleAuth() {
  const googleAuthUrl = "https://accounts.google.com/o/oauth2/auth";
  const clientId = "YOUR_CLIENT_ID_HERE";
  const redirectUri = "YOUR_REDIRECT_URI_HERE";
  const scope =
    "email profile openid https://www.googleapis.com/auth/youtube.upload";
  const responseType = "token";
  const url = `${googleAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}`;

  window.location.href = url;
}

export const getGoogleUrl = (from) => {
  const redirect_uri = (import.meta && import.meta.env && import.meta.env.VITE_REACT_APP_GOOGLE_OAUTH_REDIRECT) || 'http://localhost:3000';
  const client_id = (import.meta && import.meta.env && import.meta.env.VITE_REACT_APP_GOOGLE_CLIENT_ID) || '';

  // If no client_id is configured, return a mock URL or handle gracefully
  if (!client_id) {
    console.warn("VITE_REACT_APP_GOOGLE_CLIENT_ID not configured");
    return '#'; // Return a placeholder URL
  }

  const rootUrl = `https://accounts.google.com/o/oauth2/v2/auth`;

  const options = {
    redirect_uri,
    client_id,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      // "https://www.googleapis.com/auth/userinfo.profile",
      // "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/youtube.upload",
    ].join(" "),
    state: from,
  };

  const qs = new URLSearchParams(options);

  return `${rootUrl}?${qs.toString()}`;
};

export const sendSlackMessage = (email, subject, message) => {
  const data = {
    email,
    subject,
    message,
  };
  // TODO: Update with direct Slack webhook URL
  let url = `https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK`;

  try {
    fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
    alert(
      "We've received your message. Thank you! We'll be in contact with you soon!"
    );
    // f7.popup.close("#popover-bugs"); // Removed Framework7 dependency
  } catch (error) {
    console.error(error);
  }
};

export function getQuestionOrFormName(redirects, x) {
  let res;
  const mergedRedirects = { ...redirects, goto };

  if (x.startsWith("element:")) {
    const element = x.split(":")[1];
    const question = mergedRedirects.questions.find((q) => q.uuid === element);

    if (question) {
      if (question.inputtype == "chapter") {
        res = question.attributename;
        return res;
      }
      res =
        question.name.includes("Untitled Question") ||
        question.name.includes("undefined")
          ? question.attributename
          : question.name;
      return res;
    }
  }

  if (x.startsWith("timecode:")) {
    const timecode = x.split(":")[1];
    const question = mergedRedirects.questions.find(
      (q) => q.val === `timecode:${timecode}`
    );

    if (question) {
      if (question.inputtype == "chapter") {
        res = question.attributename;
        return res;
      }
      res =
        question.name.includes("Untitled Question") ||
        question.name.includes("undefined")
          ? question.attributename
          : question.name;
      return res;
    }
  }

  /*
    NOTES: code below is obsolete when using form alias instead of id
    if (x.startsWith("gotoform:")) {
        const formId = x.split(":")[1];
        const form = mergedRedirects.forms.find((f) => f.val === `gotoform:${formId}`);
        res = form ? form.form_title : null;
        return res;
    }
    */

  if (x.startsWith("gotoform:")) {
    const formAlias = x.split(":")[1];
    const form = mergedRedirects.forms.find((f) => f.form_alias === formAlias);
    console.log("###x", x, form);
    res = form ? form.form_title : null;
    return res;
  }

  if (Object.keys(mergedRedirects.goto).includes(x)) {
    res = mergedRedirects.goto[x];
    return res;
  }

  res = ""; // Invalid search pattern
  return res;
}

export function getActionForUser(userdata, filters) {
  for (const filterGroup of filters) {
    let meetsCriteria = true;

    for (const filter of filterGroup) {
      const key = filter.key;
      const values = filter.values;
      const method = filter.method.toLowerCase();

      if (method === "or") {
        meetsCriteria = values.some((value) => {
          if (Array.isArray(userdata[key])) {
            return userdata[key].includes(value);
          } else {
            return userdata[key] === value;
          }
        });
      } else if (method === "and") {
        meetsCriteria = values.every((value) => {
          if (Array.isArray(userdata[key])) {
            return userdata[key].includes(value);
          } else {
            return userdata[key] === value;
          }
        });
      }

      if (!meetsCriteria) {
        break;
      }
    }

    if (meetsCriteria && filterGroup[0].hasOwnProperty("action")) {
      return filterGroup[0].action;
    }
  }

  return null; // If no filter criteria is met
}

export function createResumeUrl(user, form_alias, currHostname, playedSeconds) {
  const resumeParams = {
    u: user.email,
    t: playedSeconds,
  };
  const paramsString = new URLSearchParams(resumeParams).toString();
  const url = `${currHostname}/?${form_alias}&${paramsString}`;
  return url;
}

export const inputtypeMapping = () => {
  const inputtypes = {
    start: "START",
    optin: "OPTIN",
  };
  elementTypes.map((item) => {
    inputtypes[item.inputtype] = item.title;
  });
  return inputtypes;
};

export const elementTypes = [
  {
    title: "CHAPTERS",
    text: "Videos divided into chapters. Relatable tracks progress.",
    inputtype: "chapter",
  },
  {
    title: "HOME MENU",
    text: "Interactive videos with a menu for different chapters.",
    inputtype: "homemenu",
  },
  {
    title: "REMINDER",
    text: "Allow adding a reminder to their calendar.",
    inputtype: "reminder",
  },
  {
    title: "TOUCHABLE ICON/EMOJI/BUTTON",
    text: "Clickable popups for actions like email, text, call.",
    inputtype: "clickable",
  },
  {
    title: "PHONENUMBER INPUT",
    text: "Phone registration for SMS campaigns.",
    inputtype: "registration",
  },
  {
    title: "SINGLE CHOICE",
    text: "Allows choosing one option from a list.",
    inputtype: "selectsingle",
  },
  {
    title: "MULTIPLE CHOICE",
    text: "Allows choosing multiple options.",
    inputtype: "selectmultiple",
  },
  {
    title: "SLIDERGROUP",
    text: "A set of sliders for adjustable inputs.",
    inputtype: "slidergroup",
  },
  {
    title: "RATING",
    text: "Rate with numbers on a scale.",
    inputtype: "rating",
  },
  {
    title: "STARRATING",
    text: "Rate using stars.",
    inputtype: "starrating",
  },

  {
    title: "TEXT INPUT",
    text: "Allows typing a response (limited to 160 characters).",
    inputtype: "text",
  },
  {
    title: "NUMBER INPUT",
    text: "Allows entering numeric values.",
    inputtype: "number",
  },
  {
    title: "DATE INPUT",
    text: "Displays a calendar for selecting a date.",
    inputtype: "date",
  },
  {
    title: "TIME INPUT",
    text: "Allows entering a time for answering.",
    inputtype: "time",
  },
  {
    title: "TEXT AREA INPUT",
    text: "Allows entering longer text (more than 160 characters).",
    inputtype: "textarea",
  },
];

export function findKeyValue(obj, targetKey) {
  for (const key in obj) {
    if (key === targetKey) {
      return obj[key];
    } else if (typeof obj[key] === "object" || Array.isArray(obj[key])) {
      const result = findKeyValue(obj[key], targetKey);
      if (result !== null) {
        return result;
      }
    }
  }

  return null;
}

export function daysBetweenDates(timestamp1, timestamp2) {
  // Convert timestamps to milliseconds
  const msPerDay = 24 * 60 * 60 * 1000;
  const time1 = timestamp1 * 1000;
  const time2 = timestamp2 * 1000;

  // Calculate the difference in milliseconds
  const timeDifference = Math.abs(time2 - time1);

  // Calculate the number of days
  const daysDifference = Math.floor(timeDifference / msPerDay);

  return daysDifference;
}

export function areArraysEqual(arr1, arr2) {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

export function convertToStandardYouTubeLink(inputLink) {
  // Regular expression to match various YouTube link formats
  const youtubeRegex =
    /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

  // Extract video ID using the regular expression
  const match = inputLink.match(youtubeRegex);

  if (match && match[1]) {
    // Construct the standard YouTube link
    const videoId = match[1];
    const standardLink = `https://www.youtube.com/watch?v=${videoId}`;
    return standardLink;
  } else {
    // Return an error message or handle the case where the input is not a valid YouTube link
    return inputLink;
  }
}

export async function copyCanvasToClipboard(canvasId) {
  const canvas = document.getElementById(canvasId);

  if (!canvas) {
    console.error(`Canvas with ID ${canvasId} not found.`);
    return;
  }

  canvas.toBlob((blob) => {
    const item = new ClipboardItem({ "image/png": blob });

    navigator.clipboard.write([item]).then(
      () => {
        console.debug("Canvas image copied to clipboard!");
      },
      (err) => {
        console.error("Unable to copy to clipboard.", err);
      }
    );
  }, "image/png");
}

export function secondsToDays(seconds) {
  const days = seconds / (60 * 60 * 24);
  return days;
}

export function copyElementHtmlById(elementId) {
  var doc = document;
  var element = doc.getElementById(elementId);

  if (element) {
    var range = doc.createRange();
    range.selectNode(element);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("copy");
    selection.removeAllRanges();
  }
}

export async function insertMetaData({ supabase, usr, metaData }) {
  try {
    let { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: usr.id,
        metadata: metaData,
        updated_at: new Date(),
      })
      .select();
    if (error) {
      alert(error.message); // Replaced f7.dialog.alert with alert
      throw error;
    }
    if (data) {
      // f7.tab.show("#home-slides"); // Removed Framework7 dependency - implement tab switching in React component if needed
    }
  } catch (error) {
    console.error(error.message);
  }
}

export async function iosShareUrl(url = location.href) {
  if (!navigator.share) {
    console.error("Web Share API not supported.");
    return;
  }

  try {
    await navigator.share({
      title: "Check this out!",
      text: "Found something interesting!",
      url: url,
    });
    console.log("Share successful");
  } catch (err) {
    console.error("Share failed:", err.message);
  }
}

export function getSafeVideoUrl(video) {
  if (typeof video === "string" && video.startsWith("data:")) {
    return video; // ✅ base64
  }
  if (video instanceof Blob) {
    return URL.createObjectURL(video); // ✅ Blob
  }
  return null;
}

export function getPlayableVideoSrc_({ base64, blob }) {
  if (typeof base64 === "string" && base64.startsWith("data:")) {
    return base64; // base64 direct
  }
  if (blob instanceof Blob) {
    return URL.createObjectURL(blob); // blob safe
  }
  console.warn("❌ No valid video source (base64 or blob)");
  return null;
}

export async function mobileShare(file) {
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
    console.warn("File sharing not supported. Falling back or skipping.");
    // fallback: show download button, copy link, etc.
    return;
  }

  try {
    await navigator.share({
      title: "Recorded Video",
      text: "Check out this video!",
      files: [file],
    });
    console.log("Share successful");
  } catch (err) {
    console.error("Share failed:", err.message);
  }
}

export function persistLog(message, error = null) {
  try {
    const logs = JSON.parse(localStorage.getItem("videoLogs") || "[]");
    logs.push({
      timestamp: new Date().toISOString(),
      message,
      error: error ? error.toString() : null,
    });
    localStorage.setItem("videoLogs", JSON.stringify(logs.slice(-50))); // keep only last 50 logs
  } catch (e) {
    // In case localStorage is full or blocked
    console.warn("Failed to write to localStorage log", e);
  }
}

export function webShare({ title, text, url }) {
  if (navigator.share) {
    navigator
      .share({
        title,
        text,
        url,
      })
      .then(() => {
        console.debug("Successfully shared");
      })
      .catch((error) => {
        console.error("Error sharing:", error);
      });
  } else {
    alert("Web Share API not supported.");
  }
}

export function getYouTubeThumbnailUrl(url) {
  // Extract video ID from different YouTube URL formats
  var pattern =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  var matches = url.match(pattern);

  if (matches && matches[1]) {
    // Construct the thumbnail URL
    var videoId = matches[1];
    var thumbnailUrl =
      "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";

    return thumbnailUrl;
  } else {
    // Invalid YouTube URL
    return false;
  }
}

export const text2bool = (txt) => {
  if (txt == "false") {
    return false;
  }
  if (txt == "true") {
    return true;
  }
};

export function truncateStringByWords(str, numWords = 10) {
  // Split the string into an array of words
  var wordsArray = str.split(/\s+/);

  // Select the first numWords words and join them back together
  var truncatedString = wordsArray.slice(0, numWords).join(" ");

  return truncatedString;
}

export function truncateString(str, num = 10) {
  return str.length > num ? str.slice(0, num) + "..." : str;
}

export function alertDev(str, title = "DEV") {
  if (!isLocalhost()) return;
  console.trace("alertDev");
  console.log(`[${title}]`, str); // Using console instead of Framework7 dialog
}

export function notifyDev(title, text) {
  if (!isLocalhost()) return;
  console.log(`[DEV NOTIFICATION] ${title}: ${text}`); // Using console instead of Framework7 notification
}

export function getObjectByDescription(array, description) {
  return array.find((obj) => obj.description === description);
}

export function isLocalhost() {
  return (
    location.origin.includes(".lhr.life") ||
    location.origin.includes("3000") ||
    location.origin.includes("8888") ||
    location.origin.includes("ngrok") ||
    location.origin.includes(".lt")
  );
}

// Get the appropriate api.video base URL based on environment
export const getApiVideoBaseUrl = () => isLocalhost() ? 'https://sandbox.api.video' : 'https://sandbox.api.video';

export function isDev() {
  return (
    location.href.includes("isdev") ||
    location.href.includes("crm") ||
    location.href.includes("3000") ||
    location.href.includes("8888") ||
    location.href.includes("dev") ||
    location.href.includes("ngrok")
  );
}
export function isCRM() {
  return location.origin.includes("crm");
}

export const plansRemap_ = {
  Starter: "Basic",
  relatable_pro_starter: "Basic",
  Growth: "Pro",
  relatable_pro_growth: "Pro",
  Scale: "Scale",
  relatable_pro_scale: "Scale",
};

export const plansRemap = {
  Starter: "Starter",
  relatable_pro_starter: "Starter",

  Growth: "Growth",
  relatable_pro_growth: "Growth",

  Scale: "Scale",
  relatable_pro_scale: "Scale",

  Free: "Free",
  relatable_free: "Free",

  Community: "Community",
  relatable_community: "Community",

  Basic: "Basic",
  relatable_basic: "Basic",

  Pro: "Pro",
  relatable_pro: "Pro",
};

export function formatAsPercentage(number) {
  return (number * 100).toFixed(0) + "%";
}

export function checkNewArryInOldArray(newArray, oldArray) {
  // Handle null/undefined arrays
  if (!newArray || !oldArray) {
    return false;
  }
  
  // Ensure both are arrays
  if (!Array.isArray(newArray) || !Array.isArray(oldArray)) {
    return false;
  }
  
  for (let i = 0; i < newArray.length; i++) {
    if (!oldArray.includes(newArray[i])) {
      return false;
    }
  }
  return true;
}

export function generateArray(x) {
  const result = [];
  for (let i = 1; i <= x; i++) {
    result.push(i);
  }
  return result;
}

export function convertToString(input) {
  let string = "";

  if (typeof input === "string") {
    try {
      // Try parsing the input as JSON
      const parsedInput = JSON.parse(input);
      string = parsedInput["0"] || ""; // Extract the value corresponding to key '0'
    } catch (error) {
      // If parsing as JSON fails, treat the input as a plain string
      string = input;
    }
  } else if (
    typeof input === "object" &&
    input !== null &&
    Object.keys(input).length > 0
  ) {
    // If input is an object with keys, extract the value corresponding to key '0'
    string = input["0"] || "";
  }

  return string;
}

export function convertTitleDescriptionObjectToString(data) {
  // Check if data is an object
  if (typeof data !== "object" || data === null) {
    console.error("Input data is not an object");
    return data;
  }

  data.form_title = convertToString(data.form_title);
  data.form_front.title = convertToString(data.form_front.title);
  data.form_front.description = convertToString(data.form_front.description);
  data.form_front.signup_text = convertToString(data.form_front.signup_text);
  return data;
}

export function convertQuestionsToStringBAK(questions) {
  // Step 1: Sort the questions array by the "show_at" property
  questions.sort((a, b) => a.show_at - b.show_at);

  // Step 2: Remove duplicates based on the "show_at" property
  const uniqueQuestions = [];
  const uniqueShowAtSet = new Set();

  for (const question of questions) {
    if (!uniqueShowAtSet.has(question.show_at)) {
      uniqueQuestions.push(question);
      uniqueShowAtSet.add(question.show_at);
    }
  }

  const res = uniqueQuestions.map((item) => {
    if (typeof item.question === "object") {
      // Check if the question property is an object
      // If so, extract the value
      const keys = Object.keys(item.question);
      if (keys.length > 0) {
        const key = keys[0];
        if (typeof item.question[key] === "object") {
          const innerKeys = Object.keys(item.question[key]);
          if (innerKeys.length > 0) {
            return {
              ...item,
              question: item.question[key][innerKeys[0]],
            };
          }
        } else {
          return {
            ...item,
            question: item.question[key],
          };
        }
      }
    }
    return item;
  });
  return res;
}

export function convertQuestionsToString(questions) {
  // Step 1: Sort the questions array by the "show_at" property
  questions.sort((a, b) => a.show_at - b.show_at);

  const res = questions.map((item) => {
    if (typeof item.question === "object") {
      // Check if the question property is an object
      // If so, extract the value
      const keys = Object.keys(item.question);
      if (keys.length > 0) {
        const key = keys[0];
        if (typeof item.question[key] === "object") {
          const innerKeys = Object.keys(item.question[key]);
          if (innerKeys.length > 0) {
            return {
              ...item,
              question: item.question[key][innerKeys[0]],
            };
          }
        } else {
          return {
            ...item,
            question: item.question[key],
          };
        }
      }
    }
    return item;
  });
  return res;
}

export function convertQuestionDescriptionToString(array) {
  return array.map((item) => {
    if (typeof item.question_description === "object") {
      // Check if the question_description property is an object
      // If so, extract the value
      const keys = Object.keys(item.question_description);
      if (keys.length > 0) {
        const key = keys[0];
        if (typeof item.question_description[key] === "object") {
          const innerKeys = Object.keys(item.question_description[key]);
          if (innerKeys.length > 0) {
            return {
              ...item,
              question_description:
                item.question_description[key][innerKeys[0]],
            };
          }
        } else {
          return {
            ...item,
            question_description: item.question_description[key],
          };
        }
      }
    } else {
      // If question_description is not an object, set it to an empty string
      return {
        ...item,
        question_description: "",
      };
    }
    return item;
  });
}

export function addShowAtAndUUIDToQuestions(arr) {
  return arr.map(function (obj) {
    const options = convertOptionLabelToString(obj.options);
    return {
      ...obj,
      options,
      uuid: obj?.uuid || uuid4(),
      show_at: obj.show_at
        ? parseInt(obj.show_at)
        : parseInt(keepNumbers(obj.id)),
      question: obj.question,
      // Add other properties as needed
    };
  });
}

export function convertOptionLabelToString(arr) {
  return arr.map(function (obj) {
    if (
      typeof obj.label === "object" &&
      obj.label !== null &&
      !Array.isArray(obj.label)
    ) {
      // If label is an object with a single key, extract the value
      var keys = Object.keys(obj.label);
      obj.label = obj.label[keys[0]];
    }
    return obj;
  });
}

export function addShowAtKey(questions) {
  questions.forEach((question) => {
    if (!question.hasOwnProperty("show_at")) {
      question["show_at"] = parseInt(keepNumbers(question["id"]));
    }
  });
  return questions;
}

export function convertFormDataToString(data) {
  let res = { ...data };
  res = convertTitleDescriptionObjectToString(res);
  res.form_questions = addShowAtKey([...res.form_questions]);
  res.form_questions = convertQuestionsToString([...res.form_questions]);
  res.form_questions = convertQuestionDescriptionToString([
    ...res.form_questions,
  ]);
  res.form_questions = addShowAtAndUUIDToQuestions([...res.form_questions]);
  return res;
}

export function resetSearch(elm) {
  try {
    console.debug("resetSearch", elm);

    // Reset search bar when component mounts
    // Framework7 searchbar functionality removed - implement search in React component if needed
    if (elm && typeof elm === 'string') {
      const element = document.querySelector(elm);
      if (element && element.tagName === 'INPUT') {
        element.disabled = true;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export function openExternalLink({ title, info, url }) {
  // Framework7 dialog replaced with window.open and confirm
  const message = `${title}\n\n${info}\n\nOpen external link?`;
  if (confirm(message)) {
    window.open(url, '_blank');
  }
}

export function isPWA() {
  // return true; // For testing purposes
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true; // For iOS Safari
  return isStandalone;
}

export function openPreviewInPopup({ title, url }) {
  // Framework7 popup replaced with window.open for preview
  window.open(url, 'preview', 'width=800,height=600');
}

export function sentenceToShortTitle(sentence) {
  return _.camelCase(sentence.toLowerCase());
}

export function scrollToElement({ setScrollToId, id, attempt = 0 }) {
  var currentPage = document.querySelector(".page-current");
  if (currentPage) {
    var element = currentPage.querySelector(`#${id}`);
    console.log("element", element);
    if (element) {
      // Remove existing 'active-listitem' class from other elements
      currentPage.querySelectorAll(".active-listitem").forEach((el) => {
        el.classList.remove("active-listitem");
      });
      // Add 'active-listitem' class to the target element
      element.classList.add("active-listitem");
      // Scroll to the target element
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      setScrollToId();
    } else {
      if (attempt < 10) {
        setTimeout(() => {
          scrollToElement({ setScrollToId, id, attempt: attempt + 1 });
        }, 500);
      }
    }
  }
}

export function shareUrl(form_alias, nogif = false) {
  let view = "view";
  if (location.href.includes("dev")) {
    view = "view_dev";
  }
  if (isLocalhost()) {
    view = "view_dev";
  }
  let url = `https://remotion-functions.netlify.app/${view}?alias=${encodeURIComponent(
    form_alias
  )}&uid=${passCodeGenerator()}`;
  if (nogif) {
    url = `https://remotion-functions.netlify.app/${view}?alias=${encodeURIComponent(
      form_alias
    )}&nogif=true&uid=${passCodeGenerator()}`;
  }
  return url;
}

export function formatDateTime(datePart, timePart) {
  console.log({ datePart, timePart });

  // Use the current date if datePart is not provided or invalid
  let date;
  if (isNaN(new Date(datePart).getTime())) {
    date = new Date();
  } else {
    date = new Date(datePart);
  }

  // Set time to 12:00 noon if timePart is not provided or invalid
  if (!/^\d{2}:\d{2}$/.test(timePart)) {
    timePart = "12:00";
  }

  // Combine date and time
  const combinedDateTime = new Date(
    `${date.toISOString().split("T")[0]}T${timePart}`
  );

  // Extract the date components
  const year = String(combinedDateTime.getFullYear());
  const month = String(combinedDateTime.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
  const day = String(combinedDateTime.getDate()).padStart(2, "0");

  // Extract the time components
  const hours = String(combinedDateTime.getHours()).padStart(2, "0");
  const minutes = String(combinedDateTime.getMinutes()).padStart(2, "0");

  // Format into xxxxxTxxxx
  return `${year}${month}${day}T${hours}${minutes}`;
}

export function reverseFormatDateTime(formattedString) {
  try {
    // Extract the date part
    const year = formattedString.slice(0, 4);
    const month = formattedString.slice(4, 6);
    const day = formattedString.slice(6, 8);

    // Extract the time part
    const hours = formattedString.slice(9, 11);
    const minutes = formattedString.slice(11, 13);

    // Combine into date and time strings
    const datePart = `${year}-${month}-${day}`;
    const timePart = `${hours}:${minutes}`;

    return { datePart, timePart };
  } catch (error) {
    return null;
  }
}

export function formatDaysOfMonth(days) {
  let dayNumbers = [];

  try {
    dayNumbers = days.split(",").map((day) => parseInt(day.trim()));
  } catch (error) {
    console.log(error);
  }

  const ordinalSuffix = (num) => {
    const j = num % 10,
      k = num % 100;
    if (j === 1 && k !== 11) {
      return num + "st";
    }
    if (j === 2 && k !== 12) {
      return num + "nd";
    }
    if (j === 3 && k !== 13) {
      return num + "rd";
    }
    return num + "th";
  };

  return dayNumbers.map(ordinalSuffix).join(", ");
}

export function convertDateString(dateString) {
  console.log({ dateString });
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function convertDaysCodesToFullDays(codes) {
  const dayMap = {
    MO: "Mondays",
    TU: "Tuesdays",
    WE: "Wednesdays",
    TH: "Thursdays",
    FR: "Fridays",
    SA: "Saturdays",
    SU: "Sundays",
  };

  // Split the input string and map them to full day names
  const daysArray = codes
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code); // Filtering out any empty strings

  const fullDays = daysArray.map((code) => dayMap[code] || code); // Fallback to code if not found
  return fullDays.join(", ");
}

export function convertMilitaryToRegular(militaryTime) {
  if (!militaryTime) {
    return;
  }
  const [hours, minutes] = militaryTime.split(":");
  const hoursIn12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  const period = hours < 12 ? "AM" : "PM";
  return `${hoursIn12}:${minutes} ${period}`;
}

export function formatDateString(dateString) {
  // Create a Date object from the input string
  const date = new Date(dateString);

  // Get the individual components of the date
  const year = date.getUTCFullYear(); // use getUTC methods to avoid timezone issues
  const monthIndex = date.getUTCMonth(); // returns 0-11
  const day = date.getUTCDate();

  // Define an array of month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Format the date in a string format: "Month day, year"
  return `${monthNames[monthIndex]} ${day}, ${year}`;
}

export function isBooleanKey({ list, key }) {
  return typeof list[key] === "boolean";
}

export const field_labels = {
  video_builds: "Video Builds",
  admins: "Admins",
  show: "Show in Pricing",
  video_integration: "Video Integration",
  video_length: "Video Length",
  viewers: "Viewers",
  interactions: "Interactions",
  devices: "Devices",
  share_relatables: "Share Relatables",
  clone_relatables: "Clone Relatables",
  alias_vanity_link: "Alias Vanity Link",
  interactive_onboarding: "Interactive Onboarding",
  standard_support: "Standard Support",
  priority_support: "Priority Support",
  accelerator_training: "Accelerator Training",
  interactive_recording: "Interactive Recording",
  teleprompter: "Teleprompter",
  telecaster: "Telecaster",
  ai_video_stitching: "AI Video Stitching",
  video_scrubber: "Video Scrubber",
  start_video: "Start Video",
  opt_in_element: "Opt-In Element",
  phone_element: "Phone Element",
  questions: "Questions",
  inputs: "Inputs",
  in_screen_types: "In-Screen Types",
  in_screen_actions: "In-Screen Actions",
  home_menu: "Home Menu",
  slidergroup: "Slider",
  rating: "Rating",
  starrating: "StarRating",
  chapters: "Chapters",
  reminders: "Reminders",
  google_analytics: "Google Analytics",
  element_preview: "Element Preview",
  build_preview: "Build Preview",
  continue_video: "Continue Video",
  branching_video: "Branching Video",
  external_links: "External Links",
  email_me: "Email Me",
  call_me: "Call Me",
  text_me: "Text Me",
  whatsapp_me: "WhatsApp Me",
  fbmessage_me: "FBMessage Me",
  color_customization: "Color Customization",
  new_palette: "New Palette",
  import_palette: "Import Palette",
  google_fonts: "Google Fonts",
  website_embed: "Website Embed",
  landing_page_embed: "Landing Page Embed",
  funnel_embed: "Funnel Embed",
  chatbot_embed: "Chatbot Embed",
  social_sites: "Social Sites",
  multi_app: "Multi-App",
  analytics: "Analytics",
  countries: "Countries",
  timecode_views: "Timecode Views",
  viewers_viewed: "Viewers Viewed",
  a_b_split_testing: "A/B Split Testing",
  name_email_opt_in: "Name/Email Opt-In",
  phone_opt_in: "Phone Opt-In",
  link_sharing: "Link Sharing",
  qr_code: "QR Code",
  email: "Email",
  whatsapp: "WhatsApp",
  social: "Social",
  viralshare: "ViralShare",
  timecode_reconnection: "TimeCode Re-connection",
  video_re_engagement: "Video Re-Engagement",
  workflow_integration: "Workflow Integration",
  relatable_integration: "Relatable Integration",
  more_builds: "More Builds",
  more_smartscript: "More SmartScript",
};

export const groupedForm = (form) => {
  return {
    init: {
      show: form.show,
      title: form.title,
      description: form.description,
      price: form.price,
      trial_days: form.trial_days,
      max_builds: form.max_builds,
      max_views: form.max_views,
      max_duration_video_upload: form.max_duration_video_upload,
      max_duration_video_in_video: form.max_duration_video_in_video,
      max_scripts: form.max_scripts,
      price_id: form.price_id,
      product_id: form.product_id,
      // success_url: form.success_url,
      // features: JSON.stringify(form.features),
    },
    overview: {
      admins: form.admins,
      video_integration: form.video_integration,
      video_length: form.video_length,
      viewers: form.viewers,
      interactions: form.interactions,
      devices: form.devices,
      share_relatables: form.share_relatables,
      clone_relatables: form.clone_relatables,
      alias_vanity_link: form.alias_vanity_link,
    },
    support: {
      interactive_onboarding: form.interactive_onboarding,
      standard_support: form.standard_support,
      priority_support: form.priority_support,
      accelerator_training: form.accelerator_training,
    },
    features: {
      interactive_recording: form.interactive_recording,
      teleprompter: form.teleprompter,
      telecaster: form.telecaster,
      ai_video_stitching: form.ai_video_stitching,
    },
    interactive_builds: {
      video_scrubber: form.video_scrubber,
      start_video: form.start_video,
      opt_in_element: form.opt_in_element,
      phone_element: form.phone_element,
      questions: form.questions,
      inputs: form.inputs,
      in_screen_types: form.in_screen_types,
      in_screen_actions: form.in_screen_actions,
      home_menu: form.home_menu,
      chapters: form.chapters,
      slidergroup: form.slidergroup,
      rating: form.rating,
      starrating: form.starrating,
      reminders: form.reminders,
      google_analytics: form.google_analytics,
      element_preview: form.element_preview,
      build_preview: form.build_preview,
    },
    interactive_directions: {
      continue_video: form.continue_video,
      branching_video: form.branching_video,
      external_links: form.external_links,
      email_me: form.email_me,
      call_me: form.call_me,
      text_me: form.text_me,
      whatsapp_me: form.whatsapp_me,
      fbmessage_me: form.fbmessage_me,
    },
    branding: {
      color_customization: form.color_customization,
      new_palette: form.new_palette,
      import_palette: form.import_palette,
      google_fonts: form.google_fonts,
    },
    integrations: {
      website_embed: form.website_embed,
      landing_page_embed: form.landing_page_embed,
      funnel_embed: form.funnel_embed,
      chatbot_embed: form.chatbot_embed,
      social_sites: form.social_sites,
      multi_app: form.multi_app,
    },
    data_analytics: {
      analytics: form.analytics,
      devices: form.devices,
      countries: form.countries,
      timecode_views: form.timecode_views,
      viewers_viewed: form.viewers_viewed,
      a_b_split_testing: form.a_b_split_testing,
      name_email_opt_in: form.name_email_opt_in,
      phone_opt_in: form.phone_opt_in,
    },
    sharing: {
      link_sharing: form.link_sharing,
      qr_code: form.qr_code,
      email: form.email,
      whatsapp: form.whatsapp,
      social: form.social,
      viralshare: form.viralshare,
    },
    relationship_building: {
      timecode_reconnection: form.timecode_reconnection,
      video_re_engagement: form.video_re_engagement,
      workflow_integration: form.workflow_integration,
      relatable_integration: form.relatable_integration,
    },
    account_token_management: {
      more_builds: form.more_builds,
      more_smartscript: form.more_smartscript,
    },
  };
};


export async function calculateTotalRecordedTime(videos) {
  const getDuration = (blob) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(blob);

      video.onloadedmetadata = () => {
        const duration = video.duration || 0;
        URL.revokeObjectURL(video.src);
        resolve(duration);
      };

      video.onerror = () => {
        console.warn("Failed to load video metadata.");
        resolve(0);
      };
    });
  };

  const durations = await Promise.all(
    videos.map((video) => getDuration(video.blob || video.video))
  );

  const total = durations.reduce((acc, duration) => acc + duration, 0);
  return Math.round(total); // total seconds
}

export function addOrUpdateParam(key, value) {
  const url = new URL(window.location);
  url.searchParams.set(key, value); // Add or update param
  window.history.replaceState({}, "", url); // Update URL without reloading
}

/**
 * Encrypts a string using AES-GCM encryption with Web Crypto API
 * @param {string} text - The text to encrypt
 * @param {string} password - The password to derive the encryption key from
 * @returns {Promise<string>} - The encrypted text as a base64 string
 */
export async function encrypt(text, password) {
  const pwUtf8 = new TextEncoder().encode(password);
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const alg = { name: 'AES-GCM', iv: iv };
  const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']);
  const ptUint8 = new TextEncoder().encode(text);
  const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8);
  const ctArray = Array.from(new Uint8Array(ctBuffer));
  const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join('');
  const ctBase64 = btoa(ctStr);
  const ivHex = Array.from(iv).map(b => ('00' + b.toString(16)).slice(-2)).join('');
  return ivHex + ':' + ctBase64;
}

/**
 * Decrypts a string using AES-GCM encryption with Web Crypto API
 * @param {string} encryptedText - The encrypted text to decrypt (format: iv:encryptedData)
 * @param {string} password - The password to derive the decryption key from
 * @returns {Promise<string>} - The decrypted text
 */
export async function decrypt(encryptedText, password) {
  const [ivHex, ctBase64] = encryptedText.split(':');
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const pwUtf8 = new TextEncoder().encode(password);
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
  const alg = { name: 'AES-GCM', iv: iv };
  const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']);
  const ctStr = atob(ctBase64);
  const ctUint8 = new Uint8Array(ctStr.split('').map(char => char.charCodeAt(0)));
  const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8);
  const plaintext = new TextDecoder().decode(plainBuffer);
  return plaintext;
}
