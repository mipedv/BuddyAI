def dynamic_chunking_with_metadata(text, token_limit=1000, model="cl100k_base", page_number=1):
    from nltk.tokenize import sent_tokenize
    from tiktoken import get_encoding

    try:
        enc = get_encoding(model)
    except ValueError:
        raise ValueError(f"Model '{model}' is not supported by tiktoken.")

    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = []
    current_tokens = 0
    chunk_index = 0

    for sentence in sentences:
        sentence = sentence.strip().replace("\n", " ").replace("\t", " ")
        sentence_tokens = len(enc.encode(sentence))

        # If adding this sentence exceeds the token limit, flush the current chunk
        if current_tokens + sentence_tokens > token_limit and current_chunk:
            chunk_text = " ".join(current_chunk)
            chunks.append({
                "chunk_id": f"{page_number}-{chunk_index}",
                "text": chunk_text,
                "tokens": current_tokens,
                "page_number": page_number
            })
            chunk_index += 1
            current_chunk = [sentence]
            current_tokens = sentence_tokens
        else:
            current_chunk.append(sentence)
            current_tokens += sentence_tokens

    # Add final chunk if any remains
    if current_chunk:
        chunk_text = " ".join(current_chunk)
        chunks.append({
            "chunk_id": f"{page_number}-{chunk_index}",
            "text": chunk_text,
            "tokens": current_tokens,
            "page_number": page_number
        })

    print(f"✅ Total Chunks Created: {len(chunks)}")
    for i, c in enumerate(chunks[:5]):
        print(f"Chunk {i}: {c['text'][:100]}...")

    return chunks
