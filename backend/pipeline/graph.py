from langgraph.graph import StateGraph, END
from pipeline.state import PipelineState
from pipeline.nodes import (
    transcribe_and_analyse,
    embed_and_contextualise,
    flag_check,
    save_results,
)

_builder = StateGraph(PipelineState)

_builder.add_node("transcribe_and_analyse", transcribe_and_analyse)
_builder.add_node("embed_and_contextualise", embed_and_contextualise)
_builder.add_node("flag_check", flag_check)
_builder.add_node("save_results", save_results)

_builder.set_entry_point("transcribe_and_analyse")
_builder.add_edge("transcribe_and_analyse", "embed_and_contextualise")
_builder.add_edge("embed_and_contextualise", "flag_check")
_builder.add_edge("flag_check", "save_results")
_builder.add_edge("save_results", END)

pipeline = _builder.compile()
