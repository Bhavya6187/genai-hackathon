"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { TiptapEditorProps } from "./props";
import { TiptapExtensions } from "./extensions";
import { useCompletion } from "ai/react";
import { toast } from "sonner";
import va from "@vercel/analytics";
import Axios from "axios";
import DEFAULT_EDITOR_CONTENT from "./default-content";

import { EditorBubbleMenu } from "./components";

export default function Editor() {
  const content = DEFAULT_EDITOR_CONTENT;

  const [hydrated, setHydrated] = useState(false);

  const [country, setCountry] = useState(""); // state for selected country

  const handleChange = (event) => {
    setCountry(event.target.value); // update country when a new one is selected
  };

  const editor = useEditor({
    extensions: TiptapExtensions,
    editorProps: TiptapEditorProps,
    autofocus: "end",
  });
  
  const { complete, completion, isLoading, stop } = useCompletion({
    id: "novel",
    api: "/api/generate",
    onResponse: (response) => {
      if (response.status === 429) {
        toast.error("You have reached your request limit for the day.");
        va.track("Rate Limit Reached");
        return;
      }
    },
    onFinish: (_prompt, completion) => {
      editor?.commands.setTextSelection({
        from: editor.state.selection.from - completion.length,
        to: editor.state.selection.from,
      });
    },
    onError: () => {
      toast.error("Something went wrong.");
    },
  });

  const fetchTopHeadlines = useCallback(async () => {
    if (country.length === 2) { // make API call when a country is selected
      const response = await Axios.get("https://newsapi.org/v2/top-headlines?country=" + country + "&apiKey=50e619be98af425c930cc32804d9a2c1");
      complete(JSON.stringify(response.data['articles']));
      va.track("Country Selected");
    }
  }, [country, complete]); // add dependencies here

  // Call the API when the selected country changes
  useEffect(() => {
    fetchTopHeadlines();
  }, [fetchTopHeadlines]); // dependency array


  const prev = useRef("");

  // Insert chunks of the generated text
  useEffect(() => {
    const diff = completion.slice(prev.current.length);
    prev.current = completion;
    editor?.commands.insertContent(diff, {
      parseOptions: {
        preserveWhitespace: "full",
      },
    });
  }, [isLoading, editor, completion]);

  useEffect(() => {
    // if user presses escape or cmd + z and it's loading,
    // stop the request, delete the completion, and insert back the "++"
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.metaKey && e.key === "z")) {
        stop();
        if (e.key === "Escape") {
          editor?.commands.deleteRange({
            from: editor.state.selection.from - completion.length,
            to: editor.state.selection.from,
          });
        }
        editor?.commands.insertContent("++");
      }
    };
    const mousedownHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stop();
      if (window.confirm("AI writing paused. Continue?")) {
        complete(editor?.getText() || "");
      }
    };
    if (isLoading) {
      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("mousedown", mousedownHandler);
    } else {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", mousedownHandler);
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", mousedownHandler);
    };
  }, [stop, isLoading, editor, complete, completion.length]);

  // Hydrate the editor with the content from localStorage.
  useEffect(() => {
    if (editor && content && !hydrated) {
      editor.commands.setContent(content);
      setHydrated(true);
    }
  }, [editor, content, hydrated]);

  return (
    <>
      <select onChange={handleChange}> {/* country selector */}
        <option value="">Select a country</option>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
        {/* add more options as necessary */}
      </select>

      <div
        onClick={() => {
          editor?.chain().focus().run();
        }}
        className="relative min-h-[500px] w-full max-w-screen-lg border-stone-200 p-12 px-8 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:px-12 sm:shadow-lg"
      >

        {editor ? (
          <>
            <EditorContent editor={editor} />
            <EditorBubbleMenu editor={editor} />
          </>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}
