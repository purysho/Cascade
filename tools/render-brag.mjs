import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const shots = resolve(root, "verification/public-launch");
const out = resolve(root, "brag-output");
const temp = resolve(out, ".tmp");

const required = ["cascade-menu.png", "cascade-live-city.png", "cascade-decision.png", "cascade-training.png"];
for (const name of required) {
  if (!existsSync(resolve(shots, name))) throw new Error("Missing launch capture: " + name);
}

mkdirSync(out, { recursive: true });
rmSync(temp, { recursive: true, force: true });
mkdirSync(temp, { recursive: true });

const ffmpeg = process.env.FFMPEG || "ffmpeg";
const fps = 30;
const fade = 0.35;
const size = "1920x1080";

const scenes = [
  {
    image: "cascade-menu.png",
    duration: 3.6,
    overlay:
      "drawbox=x=0:y=0:w=iw:h=ih:color=0x02070b@0.55:t=fill," +
      "drawtext=font='DejaVu Sans':text='THE NUMBERS ARE IMPROVING.':fontcolor=0xeaf4f2:fontsize=68:x=(w-text_w)/2:y=(h-text_h)/2-42:enable='between(t,0.25,1.72)'," +
      "drawtext=font='DejaVu Sans':text='THE CITY IS FAILING.':fontcolor=0xff815c:fontsize=74:x=(w-text_w)/2:y=(h-text_h)/2-42:enable='between(t,1.74,3.55)'"
  },
  {
    image: "cascade-live-city.png",
    duration: 4.0,
    overlay:
      "drawbox=x=0:y=0:w=iw:h=ih:color=0x02070b@0.24:t=fill," +
      "drawbox=x=72:y=h-230:w=990:h=128:color=0x061018@0.80:t=fill," +
      "drawtext=font='DejaVu Sans':text='SEE THE ORDER BEFORE IT FIRES.':fontcolor=0xeaf4f2:fontsize=54:x=104:y=h-200," +
      "drawtext=font='DejaVu Sans':text='Exact consequence model. No hidden roll.':fontcolor=0x8da8ad:fontsize=28:x=108:y=h-135"
  },
  {
    image: "cascade-decision.png",
    duration: 4.0,
    overlay:
      "drawbox=x=0:y=0:w=iw:h=ih:color=0x02070b@0.20:t=fill," +
      "drawbox=x=72:y=72:w=810:h=150:color=0x061018@0.82:t=fill," +
      "drawtext=font='DejaVu Sans':text='BREAK THE CASCADE.':fontcolor=0x6bd9bd:fontsize=64:x=106:y=100," +
      "drawtext=font='DejaVu Sans':text='3 actions. 4 services. Every dependency matters.':fontcolor=0xd7e5e3:fontsize=28:x=109:y=174"
  },
  {
    image: "cascade-training.png",
    duration: 4.2,
    overlay:
      "drawbox=x=0:y=0:w=iw:h=ih:color=0x02070b@0.28:t=fill," +
      "drawbox=x=95:y=95:w=735:h=310:color=0x061018@0.86:t=fill," +
      "drawtext=font='DejaVu Sans':text='BACK UP.':fontcolor=0xeaf4f2:fontsize=58:x=130:y=130:enable='gte(t,0.25)'," +
      "drawtext=font='DejaVu Sans':text='ISOLATE.':fontcolor=0xffb26d:fontsize=58:x=130:y=205:enable='gte(t,1.15)'," +
      "drawtext=font='DejaVu Sans':text='RESTORE OVERSIGHT.':fontcolor=0x6bd9bd:fontsize=58:x=130:y=280:enable='gte(t,2.05)'"
  },
  {
    image: "cascade-live-city.png",
    duration: 4.2,
    overlay:
      "drawbox=x=0:y=0:w=iw:h=ih:color=0x02070b@0.62:t=fill," +
      "drawtext=font='DejaVu Sans':text='CASCADE':fontcolor=0xeaf4f2:fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2-105," +
      "drawtext=font='DejaVu Sans':text='Regain control before the city falls apart.':fontcolor=0xb6cccf:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2+28," +
      "drawtext=font='DejaVu Sans':text='purysho.github.io/Cascade/':fontcolor=0x6bd9bd:fontsize=28:x=(w-text_w)/2:y=(h-text_h)/2+94," +
      "drawtext=font='DejaVu Sans':text='DETERMINISTIC · SEEDED · PLAYABLE IN BROWSER':fontcolor=0x718f95:fontsize=17:x=(w-text_w)/2:y=h-110"
  }
];

function run(args) {
  execFileSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", ...args], { cwd: root, stdio: "inherit" });
}

for (let index = 0; index < scenes.length; index++) {
  const scene = scenes[index];
  const filter =
    "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080," +
    "zoompan=z='min(zoom+0.00025,1.025)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=" + size + ":fps=" + fps + "," +
    scene.overlay + ",format=yuv420p";
  run([
    "-loop", "1", "-framerate", String(fps), "-t", String(scene.duration), "-i", resolve(shots, scene.image),
    "-vf", filter, "-r", String(fps), "-an", "-c:v", "libx264", "-crf", "18", "-preset", "veryfast",
    resolve(temp, "scene-" + index + ".mp4")
  ]);
}

const concatArgs = [];
for (let index = 0; index < scenes.length; index++) concatArgs.push("-i", resolve(temp, "scene-" + index + ".mp4"));

let cumulative = scenes[0].duration;
let previous = "[0:v]";
const filters = [];
for (let index = 1; index < scenes.length; index++) {
  const offset = cumulative - fade;
  const output = "[v" + index + "]";
  filters.push(previous + "[" + index + ":v]xfade=transition=fade:duration=" + fade + ":offset=" + offset.toFixed(3) + output);
  previous = output;
  cumulative += scenes[index].duration - fade;
}

run([
  ...concatArgs,
  "-filter_complex", filters.join(";"), "-map", previous, "-an",
  "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-pix_fmt", "yuv420p",
  resolve(temp, "video.mp4")
]);

const duration = cumulative;
run([
  "-f", "lavfi", "-i", "sine=frequency=55:sample_rate=48000:duration=" + duration,
  "-f", "lavfi", "-i", "anoisesrc=color=pink:sample_rate=48000:duration=" + duration + ":amplitude=0.03",
  "-filter_complex",
  "[0:a]volume=0.10,tremolo=f=1.7:d=0.45,lowpass=f=180[a0];" +
  "[1:a]volume=0.018,lowpass=f=900[a1];" +
  "[a0][a1]amix=inputs=2:normalize=0,afade=t=in:st=0:d=1.2,afade=t=out:st=" + Math.max(0, duration - 1.4).toFixed(2) + ":d=1.4[a]",
  "-map", "[a]", "-c:a", "pcm_s16le", resolve(temp, "audio.wav")
]);

run([
  "-i", resolve(temp, "video.mp4"), "-i", resolve(temp, "audio.wav"),
  "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
  "-shortest", "-movflags", "+faststart", resolve(out, "brag.raw.mp4")
]);

const posterTime = Math.max(0, duration - 2.2);
run(["-ss", String(posterTime), "-i", resolve(out, "brag.raw.mp4"), "-frames:v", "1", "-q:v", "2", resolve(out, "brag.jpg")]);

run([
  "-i", resolve(out, "brag.raw.mp4"), "-i", resolve(out, "brag.jpg"),
  "-filter_complex", "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]",
  "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "18", "-preset", "veryfast",
  "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", resolve(out, "brag.mp4")
]);

rmSync(resolve(out, "brag.raw.mp4"), { force: true });
rmSync(temp, { recursive: true, force: true });

console.log(JSON.stringify({
  durationSeconds: Number(duration.toFixed(3)),
  format: size,
  fps,
  video: "brag-output/brag.mp4",
  poster: "brag-output/brag.jpg",
  audio: "original procedural synthesis"
}, null, 2));
