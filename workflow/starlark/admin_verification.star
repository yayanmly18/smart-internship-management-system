def verify_document_review(uploaded_documents, document_validation_result):
    """
    Review documents uploaded by student based on validation results
    
    Args:
        uploaded_documents: List of uploaded documents with metadata
        document_validation_result: Result from document validation
    
    Returns:
        dict: Document review result
    """
    
    review_result = {
        "document_review_passed": False,
        "document_status": "INCOMPLETE",
        "review_score": 0,
        "review_details": [],
        "rejection_reasons": [],
        "revision_required": False,
        "revision_items": []
    }
    
    # Check if all required documents are uploaded
    if not document_validation_result.get("all_valid", False):
        review_result["document_status"] = "INCOMPLETE"
        
        # Check for missing documents
        missing_docs = document_validation_result.get("missing_required", [])
        if missing_docs:
            for missing in missing_docs:
                review_result["rejection_reasons"].append("MISSING_" + missing.get("document_type", "").upper())
                review_result["revision_items"].append({
                    "action": "ADD_DOCUMENT",
                    "document_type": missing.get("document_type"),
                    "reason": "Dokumen wajib belum diupload"
                })
        
        # Check for invalid documents
        invalid_docs = [v for v in document_validation_result.get("validation_results", []) if not v.get("valid", False)]
        if invalid_docs:
            for invalid in invalid_docs:
                doc_type = invalid.get("document_type", "")
                errors = invalid.get("errors", [])
                
                for error in errors:
                    if error == "INVALID_FILE_FORMAT":
                        review_result["revision_items"].append({
                            "action": "REPLACE_DOCUMENT",
                            "document_type": doc_type,
                            "reason": "Format file tidak sesuai"
                        })
                    elif error == "FILE_SIZE_EXCEEDED":
                        review_result["revision_items"].append({
                            "action": "REPLACE_DOCUMENT",
                            "document_type": doc_type,
                            "reason": "Ukuran file melebihi batas maksimal"
                        })
                    elif error in ["DOCUMENT_QUALITY_FAILED", "POOR_READABILITY", "MISSING_PAGES"]:
                        review_result["revision_items"].append({
                            "action": "IMPROVE_QUALITY",
                            "document_type": doc_type,
                            "reason": "Kualitas dokumen tidak memenuhi standar"
                        })
                    elif error == "DOCUMENT_NOT_RELEVANT":
                        review_result["revision_items"].append({
                            "action": "CORRECT_CONTENT",
                            "document_type": doc_type,
                            "reason": "Dokumen tidak sesuai dengan persyaratan"
                        })
        
        review_result["revision_required"] = True
        return review_result
    
    # All documents are valid
    review_result["document_review_passed"] = True
    review_result["document_status"] = "COMPLETE"
    
    # Calculate review score based on quality
    total_score = 0
    doc_count = 0
    
    for validation in document_validation_result.get("validation_results", []):
        if validation.get("valid", False):
            quality_details = validation.get("validation_details", {}).get("quality", {})
            quality_score = quality_details.get("score", 0)
            total_score = total_score + quality_score
            doc_count = doc_count + 1
            
            review_result["review_details"].append({
                "document_type": validation.get("document_type"),
                "quality_score": quality_score,
                "quality_check": quality_details.get("quality_check", "UNKNOWN"),
                "readability": quality_details.get("readability", False),
                "completeness": quality_details.get("completeness", False),
                "authenticity": quality_details.get("authenticity", "UNKNOWN"),
                "relevance": quality_details.get("relevance", False)
            })
    
    # Average score
    if doc_count > 0:
        review_result["review_score"] = round(total_score / doc_count, 2)
    
    # Determine if manual review is needed
    warnings = document_validation_result.get("warnings", [])
    if "DOCUMENT_NEEDS_REVIEW" in warnings:
        review_result["revision_required"] = True
        review_result["revision_items"].append({
            "action": "MANUAL_REVIEW",
            "reason": "Beberapa dokumen memerlukan review manual oleh admin"
        })
    
    return review_result


def verify_admin_requirements(document_data, academic_data, administrative_data, eligibility_result, document_review_result=None):
    """
    Admin Verification Logic
    Verifikasi dokumen, data akademik, dan persyaratan administrasi
    
    Args:
        document_data: Data dokumen mahasiswa (KRS, transkrip, surat pengantar, dll)
        academic_data: Data akademik mahasiswa (IPK, semester, dll)
        administrative_data: Data persyaratan administrasi (pembayaran, surat bebas tanggungan, dll)
        eligibility_result: Hasil dari Eligibility Assessment
        document_review_result: Hasil review dokumen (opsional, dari document validation)
    
    Returns:
        dict: Hasil verifikasi admin dengan status dan detail
    """
    
    verification_result = {
        "verified": False,
        "status": "PENDING",
        "document_status": "INCOMPLETE",
        "academic_status": "INVALID",
        "administrative_status": "NOT_MET",
        "rejection_reasons": [],
        "verification_details": {},
        "document_review": {}
    }
    
    # 1. Document Verification
    document_complete = True
    document_issues = []
    
    # If document_review_result is provided, use it
    if document_review_result:
        verification_result["document_review"] = document_review_result
        document_complete = document_review_result.get("document_review_passed", False)
        
        if not document_complete:
            document_issues = document_review_result.get("rejection_reasons", [])
            verification_result["rejection_reasons"].extend(document_issues)
    else:
        # Fallback to basic check
        required_documents = [
            "krs",
            "transcript",
            "internship_letter",
            "cv",
            "portfolio"
        ]
        
        for doc in required_documents:
            if doc not in document_data or not document_data[doc]:
                document_complete = False
                document_issues.append(doc + "_missing")
    
    if document_complete:
        verification_result["document_status"] = "COMPLETE"
        verification_result["verification_details"]["document"] = "All required documents are present and valid"
    else:
        verification_result["document_status"] = "INCOMPLETE"
        if "INCOMPLETE_DOCUMENT" not in verification_result["rejection_reasons"]:
            verification_result["rejection_reasons"].append("INCOMPLETE_DOCUMENT")
        verification_result["verification_details"]["document"] = "Issues: " + ", ".join(document_issues)
    
    # 2. Academic Data Verification
    academic_valid = True
    academic_issues = []
    
    # Verify GPA matches with eligibility assessment
    if "gpa" in academic_data and "gpa" in eligibility_result:
        if abs(academic_data["gpa"] - eligibility_result["gpa"]) > 0.01:
            academic_valid = False
            academic_issues.append("gpa_mismatch")
    
    # Verify semester matches
    if "semester" in academic_data and "semester" in eligibility_result:
        if academic_data["semester"] != eligibility_result["semester"]:
            academic_valid = False
            academic_issues.append("semester_mismatch")
    
    # Check if student is currently enrolled
    if "enrollment_status" in academic_data:
        if academic_data["enrollment_status"] != "ACTIVE":
            academic_valid = False
            academic_issues.append("not_enrolled")
    
    if academic_valid:
        verification_result["academic_status"] = "VALID"
        verification_result["verification_details"]["academic"] = "Academic data is valid and consistent"
    else:
        verification_result["academic_status"] = "INVALID"
        verification_result["rejection_reasons"].append("INVALID_ACADEMIC_DATA")
        verification_result["verification_details"]["academic"] = "Issues: " + ", ".join(academic_issues)
    
    # 3. Administrative Requirements Verification
    admin_met = True
    admin_issues = []
    
    # Check payment status
    if "payment_status" in administrative_data:
        if administrative_data["payment_status"] != "PAID":
            admin_met = False
            admin_issues.append("payment_not_completed")
    
    # Check clearance letter
    if "clearance_letter" in administrative_data:
        if not administrative_data["clearance_letter"]:
            admin_met = False
            admin_issues.append("clearance_letter_missing")
    
    # Check registration validity
    if "registration_valid" in administrative_data:
        if not administrative_data["registration_valid"]:
            admin_met = False
            admin_issues.append("registration_invalid")
    
    if admin_met:
        verification_result["administrative_status"] = "MET"
        verification_result["verification_details"]["administrative"] = "All administrative requirements are met"
    else:
        verification_result["administrative_status"] = "NOT_MET"
        verification_result["rejection_reasons"].append("ADMINISTRATIVE_REQUIREMENTS_NOT_MET")
        verification_result["verification_details"]["administrative"] = "Issues: " + ", ".join(admin_issues)
    
    # 4. Final Decision
    if (document_complete and academic_valid and admin_met and 
        eligibility_result.get("eligible", False)):
        verification_result["verified"] = True
        verification_result["status"] = "ADMIN_VERIFIED"
    else:
        verification_result["verified"] = False
        verification_result["status"] = "REJECTED"
        
        # Add eligibility check if not eligible
        if not eligibility_result.get("eligible", False):
            verification_result["rejection_reasons"].append("NOT_ELIGIBLE")
    
    return verification_result


def calculate_verification_score(document_data, academic_data, administrative_data):
    """
    Calculate verification score based on completeness and validity
    
    Returns:
        dict: Score breakdown and total score
    """
    
    score_breakdown = {
        "document_score": 0,
        "academic_score": 0,
        "administrative_score": 0,
        "total_score": 0,
        "max_score": 100
    }
    
    # Document Score (40 points max)
    document_score = 0
    required_documents = [
        "krs",
        "transcript", 
        "internship_letter",
        "cv",
        "portfolio"
    ]
    
    for doc in required_documents:
        if doc in document_data and document_data[doc]:
            document_score = document_score + 8  # 8 points per document
    
    score_breakdown["document_score"] = document_score
    
    # Academic Score (35 points max)
    academic_score = 0
    
    if "gpa" in academic_data:
        gpa = academic_data["gpa"]
        if gpa >= 3.5:
            academic_score = academic_score + 20
        elif gpa >= 3.0:
            academic_score = academic_score + 15
        elif gpa >= 2.75:
            academic_score = academic_score + 10
    
    if "semester" in academic_data:
        semester = academic_data["semester"]
        if semester >= 7:
            academic_score = academic_score + 15
        elif semester >= 5:
            academic_score = academic_score + 10
    
    score_breakdown["academic_score"] = academic_score
    
    # Administrative Score (25 points max)
    admin_score = 0
    
    if "payment_status" in administrative_data:
        if administrative_data["payment_status"] == "PAID":
            admin_score = admin_score + 10
    
    if "clearance_letter" in administrative_data and administrative_data["clearance_letter"]:
        admin_score = admin_score + 10
    
    if "registration_valid" in administrative_data and administrative_data["registration_valid"]:
        admin_score = admin_score + 5
    
    score_breakdown["administrative_score"] = admin_score
    score_breakdown["total_score"] = document_score + academic_score + admin_score
    
    return score_breakdown


def generate_verification_report(verification_result, score_breakdown):
    """
    Generate comprehensive verification report
    
    Returns:
        dict: Complete verification report
    """
    
    report = {
        "verification_id": verification_result.get("verification_id", ""),
        "internship_id": verification_result.get("internship_id", ""),
        "student_id": verification_result.get("student_id", ""),
        "verification_timestamp": verification_result.get("timestamp", ""),
        "verified_by": verification_result.get("verified_by", ""),
        
        "status": verification_result["status"],
        "verified": verification_result["verified"],
        
        "score_breakdown": score_breakdown,
        "score_percentage": (score_breakdown["total_score"] / score_breakdown["max_score"]) * 100,
        
        "document_status": verification_result["document_status"],
        "academic_status": verification_result["academic_status"],
        "administrative_status": verification_result["administrative_status"],
        
        "rejection_reasons": verification_result["rejection_reasons"] if not verification_result["verified"] else [],
        
        "verification_details": verification_result["verification_details"],
        
        "recommendation": ""
    }
    
    # Generate recommendation
    if verification_result["verified"]:
        if score_breakdown["total_score"] >= 90:
            report["recommendation"] = "EXCELLENT - All requirements met with high score"
        elif score_breakdown["total_score"] >= 75:
            report["recommendation"] = "GOOD - All requirements met"
        else:
            report["recommendation"] = "PASS - Minimum requirements met"
    else:
        if "INCOMPLETE_DOCUMENT" in verification_result["rejection_reasons"]:
            report["recommendation"] = "REJECT - Complete all required documents"
        elif "INVALID_ACADEMIC_DATA" in verification_result["rejection_reasons"]:
            report["recommendation"] = "REJECT - Fix academic data inconsistencies"
        elif "ADMINISTRATIVE_REQUIREMENTS_NOT_MET" in verification_result["rejection_reasons"]:
            report["recommendation"] = "REJECT - Complete administrative requirements"
        elif "NOT_ELIGIBLE" in verification_result["rejection_reasons"]:
            report["recommendation"] = "REJECT - Student is not eligible for internship"
        else:
            report["recommendation"] = "REJECT - Multiple issues found"
    
    return report


# Main execution function
def execute_admin_verification(input_data):
    """
    Main execution function for Admin Verification Workflow
    
    Args:
        input_data: Complete input data including:
            - document_data
            - academic_data
            - administrative_data
            - eligibility_result
            - verification_id
            - internship_id
            - student_id
            - verified_by
    
    Returns:
        dict: Complete verification result
    """
    
    # Extract input data
    document_data = input_data.get("document_data", {})
    academic_data = input_data.get("academic_data", {})
    administrative_data = input_data.get("administrative_data", {})
    eligibility_result = input_data.get("eligibility_result", {})
    
    # Perform verification
    verification_result = verify_admin_requirements(
        document_data,
        academic_data,
        administrative_data,
        eligibility_result
    )
    
    # Add metadata
    verification_result["verification_id"] = input_data.get("verification_id", "")
    verification_result["internship_id"] = input_data.get("internship_id", "")
    verification_result["student_id"] = input_data.get("student_id", "")
    verification_result["timestamp"] = input_data.get("timestamp", "")
    verification_result["verified_by"] = input_data.get("verified_by", "")
    
    # Calculate score
    score_breakdown = calculate_verification_score(
        document_data,
        academic_data,
        administrative_data
    )
    
    # Generate report
    report = generate_verification_report(verification_result, score_breakdown)
    
    return {
        "verification_result": verification_result,
        "score_breakdown": score_breakdown,
        "report": report
    }