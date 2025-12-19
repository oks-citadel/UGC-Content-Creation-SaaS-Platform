{{/*
Expand the name of the chart.
*/}}
{{- define "nexus-platform.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "nexus-platform.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "nexus-platform.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "nexus-platform.labels" -}}
helm.sh/chart: {{ include "nexus-platform.chart" . }}
{{ include "nexus-platform.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "nexus-platform.selectorLabels" -}}
app.kubernetes.io/name: {{ include "nexus-platform.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service selector labels
*/}}
{{- define "nexus-platform.serviceSelectorLabels" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "nexus-platform.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "nexus-platform.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Generate image reference
*/}}
{{- define "nexus-platform.image" -}}
{{- $registry := .root.Values.global.image.registry -}}
{{- $repository := .service.image.repository -}}
{{- $tag := default .root.Values.global.image.tag .service.image.tag -}}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end }}
