import React, { useCallback, useState } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import Header from "../../components/header";
import Background from "../../components/background";
import DropdownSelect, { IDropdownSelectOption } from "../../components/dropdownSelect";
import { compressJson, copy2Clipboard, prettierJson } from "./utils";
import ExportFiles from "./exportFiles";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { intlLanguages } from "./config";
import { downloadFileFromBlob, exportLocalFiles, makeLocalesInZip } from "./services";
import Spinner from "../../components/spinner";

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === "json") {
            return new jsonWorker();
        }
        if (label === "css" || label === "scss" || label === "less") {
            return new cssWorker();
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
            return new htmlWorker();
        }
        if (label === "typescript" || label === "javascript") {
            return new tsWorker();
        }
        return new editorWorker();
    },
};

loader.config({ monaco });
loader.init();

const Translate: React.FC = (props) => {
    const [originalContent, setOriginalContent] = useState("");
    const [lang, setLang] = useState<string>(intlLanguages[1].value);
    const [transContent, setTransContent] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    // const resultEditorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();

    const requestTranslation = useCallback(() => {
        setLoading(true);
        const compressedContent = compressJson(originalContent);
        fetch("/api/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: compressedContent,
                targetLang: lang,
            }),
        })
            .then((res) => res.json())
            .then((res) => {
                setTransContent(prettierJson(res.data));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [originalContent, lang]);

    return (
        <div className="text-white">
            <Header />
            <Background />
            <div className="container mx-auto mt-4">
                <div className="dark flex items-center">
                    <DropdownSelect
                        className="inline-block w-36"
                        buttonClassName="w-full"
                        options={intlLanguages}
                        selectedKey={lang}
                        onSelect={(val) => {
                            setLang(val);
                        }}
                    />
                    <button
                        type="button"
                        className="ml-2 px-6 inline-flex rounded-lg bg-indigo-500 py-1.5 px-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        onClick={requestTranslation}
                    >
                        {loading && <Spinner />}
                        translate
                    </button>
                    <ExportFiles originalContent={originalContent} />
                </div>
                <div className="grid grid-cols-2 mt-6">
                    <div className="shadow-lg border border-gray-700 rounded m-2">
                        <div className="p-2">original locale</div>
                        <MonacoEditor
                            value={originalContent}
                            onChange={(val) => {
                                setOriginalContent(val ?? "");
                            }}
                            height="600px"
                            language="json"
                            theme="vs-dark"
                        />
                    </div>
                    <div className="shadow-lg border border-gray-700 rounded m-2">
                        <div className="p-2">
                            translated locale
                            <DocumentDuplicateIcon
                                onClick={() => {
                                    copy2Clipboard(transContent);
                                }}
                                className="float-right w-4 text-white cursor-pointer hover:scale-110"
                            />
                        </div>
                        <MonacoEditor
                            // onMount={(editor, m) => {
                            //     resultEditorRef.current = editor;
                            // }}
                            value={transContent}
                            height="600px"
                            language="json"
                            theme="vs-dark"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Translate;
