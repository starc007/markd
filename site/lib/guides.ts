export type GuideSection = {
  heading: string;
  paragraphs: string[];
};

export type Guide = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  eyebrow: string;
  publishedAt: string;
  updatedAt: string;
  takeaways: string[];
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "local-first-markdown-notes",
    title: "Local-first Markdown notes without lock-in",
    shortTitle: "Local-first Markdown notes",
    description:
      "Learn what local-first note-taking means, where Markd stores your Markdown files, and how the model keeps your writing portable.",
    eyebrow: "Local-first notes",
    publishedAt: "2026-07-19",
    updatedAt: "2026-07-19",
    takeaways: [
      "Your vault is a normal folder you choose.",
      "Every note is a readable .md file, not a database record.",
      "Cloud publishing is explicit and separate from the local source files.",
    ],
    sections: [
      {
        heading: "What local-first means in Markd",
        paragraphs: [
          "Markd treats the files on your computer as the source of truth. You choose a folder, Markd keeps notes inside it as standard Markdown files, and folders in the sidebar are real folders on disk. The app does not require an account to create, edit, search, or organize a vault.",
          "That model is different from an offline cache. A cache is a temporary copy of data owned by a remote service. A Markd vault is the primary copy: it remains useful with no network connection and can be opened by other text editors or command-line tools.",
        ],
      },
      {
        heading: "Portability is a product feature",
        paragraphs: [
          "Plain Markdown reduces the cost of leaving. Titles come from filenames, hierarchy comes from folders, and optional YAML frontmatter remains in the note. Markd can present a rich editor, backlinks, properties, tabs, todos, and bookmarks without hiding the underlying document format.",
          "You can back up the vault with Time Machine, git, Syncthing, Dropbox, iCloud Drive, or another file-sync tool. Markd does not force a particular sync provider, although native Markd sync is planned for the future.",
        ],
      },
      {
        heading: "What happens when you publish",
        paragraphs: [
          "Publishing is an explicit action. Markd prepares the selected note, its linked pages, and referenced images for a public web copy. The original vault stays on your disk and remains the editable source of truth.",
          "This separation makes the boundary clear: local writing does not silently become cloud data. You choose what becomes public, and unpublishing removes the hosted site without changing the local notes.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does local-first mean Markd never uses the internet?",
        answer:
          "Core note editing works locally. Network access is used only for features that require it, such as checking for updates, fetching bookmark details, signing in, or publishing a site.",
      },
      {
        question: "Can I open a Markd vault without Markd?",
        answer:
          "Yes. Notes are ordinary Markdown files in ordinary folders, so any compatible text editor can read them.",
      },
    ],
  },
  {
    slug: "plain-text-notes-app",
    title: "A plain-text notes app with a real editor",
    shortTitle: "Plain-text notes app",
    description:
      "See how Markd combines portable plain-text Markdown files with rich editing, source mode, search, links, and properties.",
    eyebrow: "Plain-text notes",
    publishedAt: "2026-07-19",
    updatedAt: "2026-07-19",
    takeaways: [
      "Write visually or edit the Markdown source directly.",
      "Use standard links and optional YAML frontmatter.",
      "Keep filenames and folders meaningful outside the app.",
    ],
    sections: [
      {
        heading: "Plain text does not have to feel primitive",
        paragraphs: [
          "A portable file format and a polished writing experience are not opposites. Markd renders Markdown through a focused editor with headings, lists, tasks, code blocks, tables, links, images, text styles, and keyboard commands. When exact syntax matters, source mode exposes the underlying Markdown for direct editing.",
          "Both modes edit the same note. There is no export step and no second proprietary representation to keep in sync.",
        ],
      },
      {
        heading: "Files stay understandable outside the app",
        paragraphs: [
          "A note named Roadmap is stored as Roadmap.md. A project folder is a folder. Internal note links are saved as standard Markdown links, even when you type familiar wiki-link syntax. This keeps the vault readable by other editors, static-site tools, scripts, and version-control systems.",
          "Markd also preserves YAML frontmatter written by other tools. Properties are added only when you explicitly use the properties interface; the app does not inject metadata into every note automatically.",
        ],
      },
      {
        heading: "Organization without a database",
        paragraphs: [
          "Full-text search, tabs, backlinks, quick capture, daily notes, todos, bookmarks, and pinned items add structure around the files. App-specific supporting data lives beside the vault in its .markd folder rather than changing the meaning of each Markdown document.",
          "The result is a notes system that can grow more capable without making your writing dependent on one vendor’s database format.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Markdown source mode read-only?",
        answer:
          "No. Source mode is an editable CodeMirror view, and changes are saved back to the same Markdown file.",
      },
      {
        question: "Does Markd add frontmatter to every note?",
        answer:
          "No. Existing frontmatter is preserved, and Markd authors properties only after an explicit action in the properties interface.",
      },
    ],
  },
  {
    slug: "markdown-notes-macos",
    title: "A Markdown notes app built for macOS",
    shortTitle: "Markdown notes for macOS",
    description:
      "Use plain Markdown notes on Apple Silicon Macs with a signed, notarized desktop app, quick capture, keyboard navigation, and Finder access.",
    eyebrow: "Markd for macOS",
    publishedAt: "2026-07-19",
    updatedAt: "2026-07-19",
    takeaways: [
      "Native desktop packaging for Apple Silicon and macOS 12 or newer.",
      "Developer ID signed and notarized releases.",
      "Global quick capture and Finder-friendly vaults.",
    ],
    sections: [
      {
        heading: "A desktop app around files you control",
        paragraphs: [
          "Markd runs as a desktop application while keeping the vault in a folder you select. You can reveal a note or folder in Finder, use your existing backup workflow, and inspect or edit the Markdown with other Mac tools whenever you want.",
          "The current macOS build supports Apple Silicon Macs running macOS 12 or newer. Releases are signed with a Developer ID certificate and notarized by Apple before distribution.",
        ],
      },
      {
        heading: "Capture and navigate from the keyboard",
        paragraphs: [
          "A global Quick Capture window can save a thought without first finding the main Markd window. Inside the app, the command palette, customizable shortcuts, quick search, tabs, daily notes, and focus controls reduce the amount of pointer travel needed to work through a vault.",
          "Because the result is still a Markdown file, fast capture does not create an inbox that can only be processed inside a proprietary service.",
        ],
      },
      {
        heading: "Install and keep Markd current",
        paragraphs: [
          "The macOS download is distributed as a DMG. Move Markd to Applications, open a new or existing vault, and the app can check signed update metadata for later releases.",
          "Markd is currently built for Apple Silicon. An Intel macOS build is not listed, so Intel Mac users should not assume compatibility with the current download.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does Markd support Intel Macs?",
        answer:
          "The current published macOS build targets Apple Silicon. Markd lists macOS 12 or newer as the supported system version.",
      },
      {
        question: "Is the macOS app notarized?",
        answer:
          "Yes. Published macOS releases are Developer ID signed and notarized by Apple.",
      },
    ],
  },
  {
    slug: "markdown-notes-linux",
    title: "A Markdown notes app for Linux",
    shortTitle: "Markdown notes for Linux",
    description:
      "Download Markd for x86_64 Linux as an AppImage or Debian package and keep notes in portable Markdown files and real folders.",
    eyebrow: "Markd for Linux",
    publishedAt: "2026-07-19",
    updatedAt: "2026-07-19",
    takeaways: [
      "x86_64 AppImage for a portable installation.",
      "Debian package for compatible Debian and Ubuntu systems.",
      "The same folder-based Markdown vault used on macOS.",
    ],
    sections: [
      {
        heading: "Choose a portable or installed package",
        paragraphs: [
          "Markd publishes two x86_64 Linux formats. The AppImage is the portable option for many distributions; make it executable and run it without a traditional package installation. The .deb package integrates with compatible Debian and Ubuntu systems through their normal package tools.",
          "Both packages run the same Markd interface and use the same vault format. The packaging choice does not change how notes are stored.",
        ],
      },
      {
        heading: "Markdown fits Linux workflows",
        paragraphs: [
          "A Markd vault can participate in existing Linux workflows because its notes are regular files. Use grep or ripgrep, version the folder with git, back it up with rsync, or open individual notes in another editor. Markd adds a rich writing interface without closing off those tools.",
          "Real folders, standard Markdown links, and preserved YAML frontmatter also make the vault suitable for scripts and static-site pipelines.",
        ],
      },
      {
        heading: "Current Linux support",
        paragraphs: [
          "The published Linux packages target x86_64 systems. ARM Linux packages are not currently listed. Desktop integration can vary between distributions, so the AppImage is usually the clearest first option when a distribution is not Debian-based.",
          "Signed update metadata is published alongside releases so compatible installations can verify available updates.",
        ],
      },
    ],
    faqs: [
      {
        question: "Which Linux package should I download?",
        answer:
          "Use the AppImage for a portable option across many x86_64 distributions. Use the .deb package on a compatible Debian or Ubuntu system when you prefer a system installation.",
      },
      {
        question: "Is there an ARM Linux build?",
        answer:
          "The current download page lists x86_64 Linux packages only.",
      },
    ],
  },
  {
    slug: "obsidian-compatible-markdown-editor",
    title: "Use Markd with an existing Obsidian vault",
    shortTitle: "Markd and Obsidian vaults",
    description:
      "Understand which Markdown, folders, links, and frontmatter Markd can share with an Obsidian vault, and where app-specific differences remain.",
    eyebrow: "Vault compatibility",
    publishedAt: "2026-07-19",
    updatedAt: "2026-07-19",
    takeaways: [
      "Point Markd at a folder of existing Markdown notes.",
      "Real folders and YAML frontmatter remain portable.",
      "Plugin data, themes, and app settings are not interchangeable.",
    ],
    sections: [
      {
        heading: "What the two apps can share",
        paragraphs: [
          "Both Markd and Obsidian can work with folders of Markdown files. That common foundation means an existing vault does not need to be imported into a new database before Markd can read it. Filenames, folders, Markdown content, standard links, and common YAML frontmatter remain visible on disk.",
          "Markd accepts wiki-link syntax while typing and converts it to standard Markdown links for storage. This favors broad portability, but it means you should test link behavior on a copy if your vault relies on unusual aliases, embeds, or plugin-defined syntax.",
        ],
      },
      {
        heading: "What is not automatically compatible",
        paragraphs: [
          "A shared file format does not make two applications identical. Obsidian plugins, themes, workspace state, graph settings, and files inside its app-specific configuration folder do not become Markd features. Likewise, Markd’s todos, bookmarks, and local app state are not Obsidian plugins.",
          "Markdown extensions can also render differently. Back up the vault and review representative notes, especially complex embeds, callouts, plugin queries, and custom HTML, before adopting a two-app workflow.",
        ],
      },
      {
        heading: "A safe way to try the same vault",
        paragraphs: [
          "Start with a backup or a small copy of the vault. Open it in Markd, inspect folders and frontmatter, follow internal links, and compare a few notes in both editors. Keep only the syntax and features that both applications interpret the way you expect.",
          "If the vault uses mostly standard Markdown, links, images, and flat frontmatter, the file-based model makes experimentation straightforward and reversible.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does Markd import an Obsidian vault?",
        answer:
          "There is no database import. You select the folder containing the Markdown files and Markd reads that folder as a vault.",
      },
      {
        question: "Will every Obsidian plugin feature work in Markd?",
        answer:
          "No. Plugin-defined syntax and application-specific settings are not guaranteed to work. Standard Markdown and simple frontmatter are the most portable parts of a vault.",
      },
    ],
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
