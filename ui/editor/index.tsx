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

import "./App.css";

export default function Editor() {
  const content = DEFAULT_EDITOR_CONTENT;

  const [hydrated, setHydrated] = useState(false);

  const [country, setCountry] = useState(""); // state for selected country

  const editor = useEditor({
    extensions: TiptapExtensions,
    editorProps: TiptapEditorProps,
    autofocus: "end",
    editable: false,
  });

  const handleChange = (event) => {
    setCountry(event.target.value); // update country when a new one is selected
    editor.commands.clearContent();
  };

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
        from: 0,
        to: completion.length,
      });
    },
    onError: () => {
      toast.error("Something went wrong.");
    },
  });


  const fetchTopHeadlines = useCallback(async () => {
    if (country.length === 2) { // make API call when a country is selected
      console.log("Country selected - " + country)
      const bing_options = {
        method: 'GET',
        url: 'https://bing-news-search1.p.rapidapi.com/news/search',
        params: {
          q: 'location:'+country,
          freshness: 'Day',
          textFormat: 'Raw',
          safeSearch: 'Off'
        },
        headers: {
          'X-BingApis-SDK': 'true',
          'X-RapidAPI-Key': '5d9a19e397msh1d381229fff0ea6p177155jsneae9fb7fdead',
          'X-RapidAPI-Host': 'bing-news-search1.p.rapidapi.com'
        }
      };

      const response = await Axios.request(bing_options);
      console.log(response.data)
      complete(JSON.stringify(response.data['value']));
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

  // Hydrate the editor with the content from localStorage.
  useEffect(() => {
    if (editor && content && !hydrated) {
      editor.commands.setContent(content);
      setHydrated(true);
    }
  }, [editor, content, hydrated]);

  return (
    <>
      <select 
        onChange={handleChange}
        style={{
          backgroundColor: '#F3E5AB',
          border: '1px solid #645853',
          borderRadius: '4px',
          padding: '10px',
          fontSize: '18px',
          color: '#645853',
          marginBottom: '20px',
          width: '200px'
        }}
      > {/* country selector */}
        <option value="">Select a country</option>
        <option value="us">United States</option>
        <option value="in">India</option>
        <option value="cn">China</option>
        <option value="ru">Russia</option>
        <option value="mx">Mexico</option>
        {/* add more options as necessary */}
      </select>

      <div style={{marginTop: '20px'}}> {/* Gap of 20px */} </div>

      <div
        className="unselectable relative min-h-[500px] w-full max-w-screen-lg border-stone-200 p-12 px-8 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:px-12 sm:shadow-lg"
      >

        {editor ? (
          <>
            <EditorContent editor={editor} />
          </>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}
