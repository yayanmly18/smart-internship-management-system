def validate_file_format(file_name, allowed_formats):
    """
    Validate file format based on extension
    
    Args:
        file_name: Name of the uploaded file
        allowed_formats: List of allowed file extensions
    
    Returns:
        dict: Validation result
    """
    
    result = {
        "valid": False,
        "format": "",
        "reason": ""
    }
    
    # Extract file extension
    if "." not in file_name:
        result["reason"] = "File has no extension"
        return result
    
    file_extension = file_name.split(".")[-1].upper()
    result["format"] = file_extension
    
    # Check if format is allowed
    if file_extension in allowed_formats:
        result["valid"] = True
        result["reason"] = "Format is valid"
    else:
        result["reason"] = f"Format {file_extension} not allowed. Allowed: {', '.join(allowed_formats)}"
    
    return result


def validate_file_size(file_size_bytes, max_size_mb):
    """
    Validate file size
    
    Args:
        file_size_bytes: File size in bytes
        max_size_mb: Maximum allowed size in megabytes
    
    Returns:
        dict: Validation result
    """
    
    result = {
        "valid": False,
        "size_mb": 0,
        "max_size_mb": max_size_mb,
        "reason": ""
    }
    
    # Convert to MB
    size_mb = file_size_bytes / (1024 * 1024)
    result["size_mb"] = round(size_mb, 2)
    
    if size_mb <= max_size_mb:
        result["valid"] = True
        result["reason"] = "File size is within limit"
    else:
        result["reason"] = f"File size {result['size_mb']}MB exceeds limit of {max_size_mb}MB"
    
    return result


def validate_document_quality(file_data):
    """
    Validate document quality (simulated - in production would use OCR/ML)
    
    Args:
        file_data: Document metadata and content info
    
    Returns:
        dict: Quality validation result
    """
    
    result = {
        "quality_check": "PASS",
        "readability": True,
        "completeness": True,
        "authenticity": "LIKELY_AUTHENTIC",
        "relevance": True,
        "issues": [],
        "score": 0
    }
    
    score = 0
    max_score = 100
    
    # 1. Readability Check (25 points)
    if file_data.get("resolution_dpi", 0) >= 200:
        score = score + 25
        result["readability"] = True
    elif file_data.get("resolution_dpi", 0) >= 150:
        score = score + 15
        result["readability"] = True
        result["issues"].append("LOW_RESOLUTION")
    else:
        result["readability"] = False
        result["issues"].append("POOR_READABILITY")
    
    # 2. Completeness Check (25 points)
    if file_data.get("page_count", 0) >= 1:
        score = score + 25
        result["completeness"] = True
    else:
        result["completeness"] = False
        result["issues"].append("MISSING_PAGES")
    
    # 3. Authenticity Check (25 points)
    authenticity = file_data.get("authenticity", "UNKNOWN")
    if authenticity == "LIKELY_AUTHENTIC":
        score = score + 25
        result["authenticity"] = "LIKELY_AUTHENTIC"
    elif authenticity == "REVIEW_REQUIRED":
        score = score + 10
        result["authenticity"] = "REVIEW_REQUIRED"
        result["issues"].append("NEEDS_AUTHENTICITY_REVIEW")
    else:
        score = score + 0
        result["authenticity"] = "NOT_AUTHENTIC"
        result["issues"].append("DOCUMENT_NOT_AUTHENTIC")
    
    # 4. Relevance Check (25 points)
    if file_data.get("relevant", True):
        score = score + 25
        result["relevance"] = True
    else:
        result["relevance"] = False
        result["issues"].append("DOCUMENT_NOT_RELEVANT")
    
    result["score"] = score
    
    # Determine quality check result
    if score >= 80:
        result["quality_check"] = "PASS"
    elif score >= 60:
        result["quality_check"] = "REVIEW_REQUIRED"
    else:
        result["quality_check"] = "FAIL"
    
    return result


def validate_single_document(document, document_rules):
    """
    Validate a single uploaded document
    
    Args:
        document: Document data
            {
                "document_type": "krs",
                "file_name": "krs.pdf",
                "file_size_bytes": 1024000,
                "upload_date": "2026-06-22",
                "file_data": {...}
            }
        document_rules: Rules for this document type
    
    Returns:
        dict: Validation result for this document
    """
    
    result = {
        "document_type": document.get("document_type", ""),
        "valid": False,
        "format_valid": False,
        "size_valid": False,
        "quality_valid": False,
        "errors": [],
        "warnings": [],
        "validation_details": {}
    }
    
    # 1. Check if required
    if document_rules.get("required", False) and not document.get("file_name"):
        result["errors"].append("REQUIRED_DOCUMENT_MISSING")
        return result
    
    # If not provided and not required, skip validation
    if not document.get("file_name"):
        result["valid"] = True
        return result
    
    # 2. Validate file format
    format_validation = validate_file_format(
        document.get("file_name", ""),
        document_rules.get("allowed_formats", [])
    )
    result["format_valid"] = format_validation["valid"]
    result["validation_details"]["format"] = format_validation
    
    if not format_validation["valid"]:
        result["errors"].append("INVALID_FILE_FORMAT")
    
    # 3. Validate file size
    size_validation = validate_file_size(
        document.get("file_size_bytes", 0),
        document_rules.get("max_size_mb", 5)
    )
    result["size_valid"] = size_validation["valid"]
    result["validation_details"]["size"] = size_validation
    
    if not size_validation["valid"]:
        result["errors"].append("FILE_SIZE_EXCEEDED")
    
    # 4. Validate document quality
    quality_validation = validate_document_quality(
        document.get("file_data", {})
    )
    result["quality_valid"] = quality_validation["quality_check"] in ["PASS", "REVIEW_REQUIRED"]
    result["validation_details"]["quality"] = quality_validation
    
    if quality_validation["quality_check"] == "FAIL":
        result["errors"].append("DOCUMENT_QUALITY_FAILED")
    elif quality_validation["quality_check"] == "REVIEW_REQUIRED":
        result["warnings"].append("DOCUMENT_NEEDS_REVIEW")
    
    # Add any specific issues
    result["errors"].extend(quality_validation.get("issues", []))
    
    # Final validation
    result["valid"] = (
        result["format_valid"] and 
        result["size_valid"] and 
        result["quality_valid"] and
        len([e for e in result["errors"] if e not in ["DOCUMENT_NOT_AUTHENTIC", "NEEDS_AUTHENTICITY_REVIEW"]]) == 0
    )
    
    return result


def validate_all_documents(uploaded_documents, document_rules):
    """
    Validate all uploaded documents
    
    Args:
        uploaded_documents: List of uploaded documents
        document_rules: Rules for document types
    
    Returns:
        dict: Complete validation result
    """
    
    result = {
        "all_valid": False,
        "total_documents": 0,
        "valid_documents": 0,
        "invalid_documents": 0,
        "missing_required": [],
        "validation_results": [],
        "total_size_mb": 0,
        "errors": [],
        "warnings": []
    }
    
    total_size_bytes = 0
    required_docs_found = set()
    
    # Validate each uploaded document
    for doc in uploaded_documents:
        doc_type = doc.get("document_type", "")
        
        # Find rules for this document type
        doc_rules = None
        for rule in document_rules:
            if rule.get("document_type") == doc_type:
                doc_rules = rule
                break
        
        if not doc_rules:
            continue
        
        # Validate document
        validation_result = validate_single_document(doc, doc_rules)
        result["validation_results"].append(validation_result)
        
        # Track statistics
        result["total_documents"] = result["total_documents"] + 1
        total_size_bytes = total_size_bytes + doc.get("file_size_bytes", 0)
        
        if validation_result["valid"]:
            result["valid_documents"] = result["valid_documents"] + 1
        else:
            result["invalid_documents"] = result["invalid_documents"] + 1
            result["errors"].extend(validation_result["errors"])
        
        result["warnings"].extend(validation_result["warnings"])
        
        # Track required documents
        if doc_rules.get("required", False):
            required_docs_found.add(doc_type)
    
    # Check for missing required documents
    for rule in document_rules:
        if rule.get("required", False):
            doc_type = rule.get("document_type")
            if doc_type not in required_docs_found:
                result["missing_required"].append({
                    "document_type": doc_type,
                    "display_name": rule.get("display_name", doc_type)
                })
    
    # Calculate total size
    result["total_size_mb"] = round(total_size_bytes / (1024 * 1024), 2)
    
    # Check total size limit
    max_total_size = 25  # MB
    if result["total_size_mb"] > max_total_size:
        result["errors"].append(f"TOTAL_SIZE_EXCEEDED: {result['total_size_mb']}MB > {max_total_size}MB")
    
    # Final result
    result["all_valid"] = (
        len(result["missing_required"]) == 0 and
        result["invalid_documents"] == 0 and
        len(result["errors"]) == 0
    )
    
    return result


def check_document_completeness(uploaded_documents, required_document_types):
    """
    Check if all required documents are uploaded
    
    Args:
        uploaded_documents: List of uploaded documents
        required_document_types: List of required document types
    
    Returns:
        dict: Completeness check result
    """
    
    uploaded_types = set()
    for doc in uploaded_documents:
        if doc.get("file_name"):
            uploaded_types.add(doc.get("document_type"))
    
    missing = []
    for doc_type in required_document_types:
        if doc_type not in uploaded_types:
            missing.append(doc_type)
    
    return {
        "complete": len(missing) == 0,
        "uploaded_count": len(uploaded_types),
        "required_count": len(required_document_types),
        "missing_documents": missing,
        "completion_percentage": (len(uploaded_types) / len(required_document_types)) * 100
    }


def generate_document_upload_summary(uploaded_documents, validation_result):
    """
    Generate summary of document upload
    
    Args:
        uploaded_documents: List of uploaded documents
        validation_result: Result from validate_all_documents
    
    Returns:
        dict: Upload summary
    """
    
    summary = {
        "upload_timestamp": "",
        "total_documents": validation_result["total_documents"],
        "valid_documents": validation_result["valid_documents"],
        "invalid_documents": validation_result["invalid_documents"],
        "total_size_mb": validation_result["total_size_mb"],
        "status": "",
        "documents": [],
        "missing_required": validation_result["missing_required"],
        "errors": validation_result["errors"],
        "warnings": validation_result["warnings"],
        "next_steps": []
    }
    
    # Add document details
    for doc in uploaded_documents:
        doc_summary = {
            "document_type": doc.get("document_type"),
            "file_name": doc.get("file_name"),
            "file_size_mb": round(doc.get("file_size_bytes", 0) / (1024 * 1024), 2),
            "upload_date": doc.get("upload_date", "")
        }
        
        # Find validation result for this document
        for val_result in validation_result["validation_results"]:
            if val_result["document_type"] == doc.get("document_type"):
                doc_summary["valid"] = val_result["valid"]
                doc_summary["errors"] = val_result["errors"]
                break
        
        summary["documents"].append(doc_summary)
    
    # Determine status
    if validation_result["all_valid"]:
        summary["status"] = "ALL_VALID"
        summary["next_steps"].append("Proceed to eligibility assessment")
    elif len(validation_result["missing_required"]) > 0:
        summary["status"] = "MISSING_DOCUMENTS"
        summary["next_steps"].append("Upload missing required documents")
    elif validation_result["invalid_documents"] > 0:
        summary["status"] = "INVALID_DOCUMENTS"
        summary["next_steps"].append("Fix invalid documents and re-upload")
    else:
        summary["status"] = "VALIDATION_FAILED"
        summary["next_steps"].append("Review errors and take necessary action")
    
    return summary


# Main execution function
def execute_document_validation(input_data):
    """
    Main execution function for document validation
    
    Args:
        input_data: Complete input data including:
            - uploaded_documents: List of uploaded documents
            - document_rules: Rules for document validation
            - student_id: Student ID
            - internship_id: Internship ID
    
    Returns:
        dict: Complete validation result
    """
    
    uploaded_documents = input_data.get("uploaded_documents", [])
    document_rules = input_data.get("document_rules", [])
    
    # Validate all documents
    validation_result = validate_all_documents(uploaded_documents, document_rules)
    
    # Generate summary
    summary = generate_document_upload_summary(uploaded_documents, validation_result)
    
    # Add metadata
    summary["student_id"] = input_data.get("student_id", "")
    summary["internship_id"] = input_data.get("internship_id", "")
    summary["validation_timestamp"] = input_data.get("timestamp", "")
    
    return {
        "validation_result": validation_result,
        "summary": summary
    }