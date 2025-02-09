import React, { useEffect, useState } from "react";
import { Question } from "./types";
import { FieldArray, FormikProvider, Field, useFormik } from "formik";
import { Button } from "./Button";
import useResults from "@azure-fundamentals/hooks/useResults";

type Props = {
  isLoading: boolean;
  handleNextQuestion: (q: number) => void;
  handleSkipQuestion: (q: number) => void;
  handleCountAnswered: () => void;
  currentQuestionIndex: number;
  totalQuestions: number;
  windowWidth: number;
  question: string;
  questions: Question[];
  options: any;
  stopTimer: () => void;
  getResultPoints: (data: number) => void;
  revealExam?: boolean;
  hideExam?: () => void;
  remainingTime?: string;
};

const QuizExamForm: React.FC<Props> = ({
  isLoading,
  handleNextQuestion,
  handleSkipQuestion,
  handleCountAnswered,
  currentQuestionIndex,
  totalQuestions,
  windowWidth,
  question,
  options,
  stopTimer,
  getResultPoints,
  questions,
  revealExam,
  hideExam,
  remainingTime,
}) => {
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
  const [savedAnswers, setSavedAnswers] = useState<any>([]);
  const { points, reCount } = useResults(savedAnswers);

  const noOfAnswers = options
    ? options?.filter((el: any) => el.isAnswer === true).length
    : 0;

  const formik = useFormik({
    initialValues: {
      options: [
        {
          checked: false,
          text: "Option 1",
          isAnswer: false,
        },
      ],
    },
    onSubmit: () => {
      saveAnswers(false).then(() => {
        reCount({
          questions: questions,
          answers: savedAnswers,
        });
      });
      stopTimer();
    },
  });

  useEffect(() => {
    getResultPoints(points);
  }, [points]);

  useEffect(() => {
    if (revealExam) {
      setShowCorrectAnswer(true);
    }
  }, [revealExam]);

  useEffect(() => {
    if (remainingTime === "00:00") {
      formik.submitForm();
    }
  }, [remainingTime]);

  const nextQuestion = (skip: boolean) => {
    if (skip === false) {
      let done = true;
      for (let x = 0; x < savedAnswers.length; x++) {
        if (savedAnswers[x] === null && x !== currentQuestionIndex) {
          done = false;
          break;
        }
      }
      if (done === true) {
        handleCountAnswered();
        formik.submitForm();
        return;
      } else {
        saveAnswers(skip);
      }
    } else {
      saveAnswers(skip);
    }
    let areAllQuestionsAnswered = false;
    let i = currentQuestionIndex + 1;
    while (savedAnswers[i] !== null && i < totalQuestions) {
      i++;
    }
    if (i >= totalQuestions) {
      i = 0;
    }
    while (savedAnswers[i] !== null && i < totalQuestions) {
      i++;
    }
    if (i >= totalQuestions) {
      areAllQuestionsAnswered = true;
    }
    if (skip === true) {
      handleSkipQuestion(i);
    } else {
      if (areAllQuestionsAnswered) {
        formik.submitForm();
      } else {
        handleCountAnswered();
        handleNextQuestion(i);
      }
    }
  };

  const areAllQuestionsAnswered = (): boolean => {
    for (const answers of savedAnswers) {
      if (answers == null) {
        return false;
      }
    }
    return true;
  };

  const isQuestionAnswered = (): boolean => {
    for (const answer of formik.values?.options) {
      if (answer.checked === true) {
        return true;
      }
    }
    return false;
    //return savedAnswers[currentQuestionIndex] != null;
  };

  const isOptionChecked = (optionText: string): boolean | undefined => {
    /* if (!showCorrectAnswer) {
      return false;
    } */

    const savedAnswer = savedAnswers[currentQuestionIndex];
    return typeof savedAnswer === "string" || !savedAnswer
      ? savedAnswer === optionText
      : savedAnswer.includes(optionText);
  };

  useEffect(() => {
    const savedAnswersInit = [];
    for (let i = 0; i < totalQuestions; i++) {
      savedAnswersInit.push(null);
    }
    setSavedAnswers(savedAnswersInit);
  }, []);

  useEffect(() => {
    const opt = options?.map((option: any) => {
      return {
        checked: isOptionChecked(option.text),
        text: option.text,
        isAnswer: option.isAnswer,
      };
    });
    formik.setFieldValue("options", opt ?? []);
  }, [options]);

  const saveAnswers = async (skip = false) => {
    if (skip === true) {
      let saved = [...savedAnswers];
      saved[currentQuestionIndex] = null;
      setSavedAnswers(saved);
      return;
    }
    let selectedArr = [];
    let selected = null;
    for (const answer of formik.values.options) {
      if (answer.checked && noOfAnswers > 1) {
        selectedArr.push(answer.text);
      } else if (answer.checked && noOfAnswers == 1) {
        selected = answer.text;
      }
    }
    let saved = [...savedAnswers];
    saved[currentQuestionIndex] =
      noOfAnswers > 1 && selectedArr?.length > 0 ? selectedArr : selected;
    setSavedAnswers(saved);
  };

  if (isLoading) return <p>Loading...</p>;
  //const imgUrl: string = `/api/og?question=${question}&width=${windowWidth}`;

  return (
    <FormikProvider value={formik}>
      <div className="relative min-h-40">
        {/* <Image
          src={imgUrl}
          alt="question"
          width={1200}
          height={200}
          priority={true}
          unoptimized
          loading="eager"
        /> */}
        <div className="relative min-h-40 mt-8">
          <p className="text-white px-12 py-6 select-none">
            {currentQuestionIndex + 1}. {question}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-2 mt-5 mb-16 select-none md:px-12 px-0 h-max min-h-[250px]">
        <FieldArray
          name="options"
          render={() =>
            formik.values?.options?.length > 0
              ? formik.values?.options?.map((option: any, index: any) => (
                  <>
                    <Field
                      className="peer hidden [&:checked_+_label_svg]:block"
                      key={`options.${currentQuestionIndex}.${index}`}
                      disabled={showCorrectAnswer}
                      type={"checkbox"}
                      id={`options.${currentQuestionIndex}.${index}`}
                      name={`options.${index}.checked`}
                      value={formik.values.options[index]?.checked}
                      checked={formik.values.options[index]?.checked}
                      onChange={() => {
                        if (
                          noOfAnswers === 1 &&
                          !formik.values.options[index]?.checked
                        ) {
                          for (
                            let i = 0;
                            i < formik.values.options.length;
                            i++
                          ) {
                            if (i !== index) {
                              formik.setFieldValue(
                                `options.${i}.checked`,
                                false,
                              );
                            }
                          }
                          formik.setFieldValue(
                            `options.${index}.checked`,
                            !formik.values.options[index]?.checked,
                          );
                        } else {
                          formik.setFieldValue(
                            `options.${index}.checked`,
                            !formik.values.options[index]?.checked,
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`options.${currentQuestionIndex}.${index}`}
                      className={`m-[1px] flex cursor-pointer items-center rounded-lg border hover:bg-slate-600 p-4 text-xs sm:text-sm font-medium shadow-sm ${
                        showCorrectAnswer &&
                        formik.values.options[index]?.isAnswer
                          ? formik.values.options[index]?.checked
                            ? "border-emerald-500 bg-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-600/50"
                            : `border-emerald-500 bg-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-600/50 ${
                                formik.values.options[index]?.checked
                                  ? "border-emerald-500 bg-emerald-500/50"
                                  : ""
                              }`
                          : formik.values.options[index]?.checked
                            ? "border-gray-400 bg-gray-500/25 hover:border-gray-300 hover:bg-gray-600"
                            : `border-slate-500 bg-gray-600/25 hover:border-gray-400/75 hover:bg-gray-600/75 ${
                                formik.values.options[index]?.checked
                                  ? "border-gray-400 hover:border-slate-300 bg-gray-600"
                                  : ""
                              }`
                      }`}
                    >
                      <svg
                        className={`border rounded-full absolute h-5 w-5 p-0.5 ${
                          showCorrectAnswer &&
                          formik.values.options[index]?.isAnswer
                            ? "text-emerald-500 border-emerald-600"
                            : "text-gray-200 border-slate-500"
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path
                          className={`${
                            formik.values.options[index]?.checked
                              ? "block"
                              : "hidden"
                          }`}
                          fillRule="evenodd"
                          d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-200 pl-7 break-words inline-block w-full">
                        {option?.text}
                      </span>
                    </label>
                  </>
                ))
              : null
          }
        />
      </ul>
      {!revealExam ? (
        <div className="flex justify-center flex-col sm:flex-row gap-4">
          <Button
            type="button"
            intent="primary"
            size="medium"
            onClick={async () => {
              nextQuestion(true);
            }}
          >
            <span>Skip Question</span>
          </Button>
          <Button
            type="button"
            intent="primary"
            size="medium"
            disabled={!isQuestionAnswered()}
            onClick={async () => {
              nextQuestion(false);
            }}
          >
            <span className={`${!isQuestionAnswered() ? "opacity-50" : ""}`}>
              Next Question
            </span>
          </Button>
        </div>
      ) : (
        <div className="flex justify-center flex-col sm:flex-row gap-4">
          <Button
            type="button"
            intent="primary"
            size="medium"
            disabled={currentQuestionIndex === 0}
            onClick={async () => {
              handleNextQuestion(currentQuestionIndex - 1);
            }}
          >
            <span
              className={`${currentQuestionIndex === 0 ? "opacity-50" : ""}`}
            >
              Previous Question
            </span>
          </Button>
          <Button
            type="button"
            intent="primary"
            size="medium"
            disabled={currentQuestionIndex === totalQuestions - 1}
            onClick={async () => {
              handleNextQuestion(currentQuestionIndex + 1);
            }}
          >
            <span
              className={`${
                currentQuestionIndex === totalQuestions - 1 ? "opacity-50" : ""
              }`}
            >
              Next Question
            </span>
          </Button>
          <Button
            type="button"
            intent="secondary"
            size="medium"
            onClick={() => {
              if (hideExam) {
                hideExam();
              }
            }}
          >
            <span>Back</span>
          </Button>
        </div>
      )}
    </FormikProvider>
  );
};

export default QuizExamForm;
